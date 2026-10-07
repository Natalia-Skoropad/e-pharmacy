import mongoose, { Types, type ClientSession } from 'mongoose';

import {
  ADMIN_AUDIT_ACTIONS,
  ADMIN_AUDIT_ENTITY_TYPES,
  ADMIN_AUDIT_SECTIONS,
} from '../constants/admin-audit';

import {
  PHARMACY_OWNER_DOCUMENT_RULES,
  PHARMACY_OWNER_DOCUMENT_VALIDATION_MESSAGES,
} from '../constants/pharmacy-owner-document-validation';

import { HTTP_STATUS } from '../constants/httpStatus';
import { Pharmacy } from '../models/pharmacy.model';
import { PharmacyOwnerDocument } from '../models/pharmacyOwnerDocument.model';
import type { PharmacyOwnerDocumentUploadInput } from '../schemas/pharmacy-owner-document.schema';
import type { PharmacyOwnerDocumentMetadataDto } from '../types/pharmacy-owner-document';
import { decodeAndVerifyDocumentUpload } from '../utils/documentUpload';
import { httpError } from '../utils/httpError';
import { appendAdminAuditLog } from './admin-audit.service';

//===============================================================

type DocumentRecord = Readonly<{
  _id: Types.ObjectId;
  name: string;
  size: number;
  type: string;
  createdAt: Date;
  updatedAt: Date;
}>;

//===============================================================

function serializeDocument(
  document: DocumentRecord
): PharmacyOwnerDocumentMetadataDto {
  return {
    id: String(document._id),
    name: document.name,
    size: document.size,
    type: document.type,
    uploadedAt: document.createdAt.toISOString(),
    updatedAt: document.updatedAt.toISOString(),
  };
}

//===============================================================

function auditSnapshot(document: {
  name: string;
  size: number;
  type: string;
}): Readonly<Record<string, string | number | boolean>> {
  return {
    exists: true,
    name: document.name,
    size: document.size,
    type: document.type,
  };
}

//===============================================================

async function assertOwnerAccount(
  ownerUserId: string,
  session?: ClientSession
): Promise<void> {
  if (!Types.ObjectId.isValid(ownerUserId)) {
    throw httpError(HTTP_STATUS.NOT_FOUND, 'Pharmacy owner was not found.');
  }

  const query = Pharmacy.exists({ ownerId: ownerUserId });
  if (session) query.session(session);

  if (!(await query)) {
    throw httpError(HTTP_STATUS.NOT_FOUND, 'Pharmacy owner was not found.');
  }
}

//===============================================================

async function getOwnerDocumentsForQuota(
  ownerUserId: string,
  session: ClientSession
): Promise<Array<{ _id: Types.ObjectId; size: number }>> {
  return PharmacyOwnerDocument.find({ ownerUserId })
    .select('_id size')
    .session(session)
    .lean<Array<{ _id: Types.ObjectId; size: number }>>();
}

//===============================================================

function assertUploadQuota(
  existingDocuments: readonly { size: number }[],
  incomingSize: number
): void {
  if (existingDocuments.length >= PHARMACY_OWNER_DOCUMENT_RULES.maxFiles) {
    throw httpError(
      HTTP_STATUS.BAD_REQUEST,
      PHARMACY_OWNER_DOCUMENT_VALIDATION_MESSAGES.count
    );
  }

  const totalSizeBytes =
    existingDocuments.reduce((total, document) => total + document.size, 0) +
    incomingSize;

  if (totalSizeBytes > PHARMACY_OWNER_DOCUMENT_RULES.maxTotalSizeBytes) {
    throw httpError(
      HTTP_STATUS.BAD_REQUEST,
      PHARMACY_OWNER_DOCUMENT_VALIDATION_MESSAGES.totalSize
    );
  }
}

//===============================================================

export async function listPharmacyOwnerDocumentsService(
  ownerUserId: string
): Promise<PharmacyOwnerDocumentMetadataDto[]> {
  await assertOwnerAccount(ownerUserId);

  const documents = await PharmacyOwnerDocument.find({ ownerUserId })
    .select('_id name size type createdAt updatedAt')
    .sort({ createdAt: -1, _id: -1 })
    .lean<DocumentRecord[]>();

  return documents.map(serializeDocument);
}

//===============================================================

export async function getPharmacyOwnerDocumentContentService(
  ownerUserId: string,
  documentId: string
): Promise<{
  document: PharmacyOwnerDocumentMetadataDto;
  content: Buffer;
}> {
  await assertOwnerAccount(ownerUserId);

  const document = await PharmacyOwnerDocument.findOne({
    _id: documentId,
    ownerUserId,
  }).select('+content');

  if (!document?.content) {
    throw httpError(HTTP_STATUS.NOT_FOUND, 'Owner document was not found.');
  }

  return {
    document: serializeDocument(document),
    content: Buffer.from(document.content),
  };
}

//===============================================================

export async function createPharmacyOwnerDocumentService(
  ownerUserId: string,
  input: PharmacyOwnerDocumentUploadInput,
  auditRequestId: string
): Promise<PharmacyOwnerDocumentMetadataDto> {
  const verified = decodeAndVerifyDocumentUpload(
    input,
    PHARMACY_OWNER_DOCUMENT_RULES
  );

  const session = await mongoose.startSession();
  let result: PharmacyOwnerDocumentMetadataDto | null = null;

  try {
    await session.withTransaction(async () => {
      await assertOwnerAccount(ownerUserId, session);

      const existingDocuments = await getOwnerDocumentsForQuota(
        ownerUserId,
        session
      );

      assertUploadQuota(existingDocuments, verified.size);

      const [createdDocument] = await PharmacyOwnerDocument.create(
        [
          {
            ownerUserId,
            uploadedByUserId: ownerUserId,
            name: input.name,
            ...verified,
          },
        ],
        { session }
      );

      result = serializeDocument(createdDocument);

      await appendAdminAuditLog({
        actorUserId: ownerUserId,
        action: ADMIN_AUDIT_ACTIONS.PHARMACY_OWNER_DOCUMENT_UPLOADED,
        section: ADMIN_AUDIT_SECTIONS.PHARMACY_OWNERS,
        entityType: ADMIN_AUDIT_ENTITY_TYPES.PHARMACY_OWNER_DOCUMENT,
        entityId: String(createdDocument._id),
        entityLabel: createdDocument.name,
        scopeEntityType: ADMIN_AUDIT_ENTITY_TYPES.PHARMACY_OWNER,
        scopeEntityId: ownerUserId,
        before: { exists: false },
        after: auditSnapshot(createdDocument),
        changedFields: ['exists', 'name', 'size', 'type'],
        requestId: auditRequestId,
        session,
      });
    });
  } finally {
    await session.endSession();
  }

  if (!result) {
    throw new Error('Owner document upload transaction did not commit.');
  }

  return result;
}

//===============================================================

export async function deletePharmacyOwnerDocumentService(
  ownerUserId: string,
  documentId: string,
  auditRequestId: string
): Promise<void> {
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      await assertOwnerAccount(ownerUserId, session);

      const document = await PharmacyOwnerDocument.findOneAndDelete(
        {
          _id: documentId,
          ownerUserId,
        },
        { session }
      );

      if (!document) {
        throw httpError(HTTP_STATUS.NOT_FOUND, 'Owner document was not found.');
      }

      await appendAdminAuditLog({
        actorUserId: ownerUserId,
        action: ADMIN_AUDIT_ACTIONS.PHARMACY_OWNER_DOCUMENT_DELETED,
        section: ADMIN_AUDIT_SECTIONS.PHARMACY_OWNERS,
        entityType: ADMIN_AUDIT_ENTITY_TYPES.PHARMACY_OWNER_DOCUMENT,
        entityId: String(document._id),
        entityLabel: document.name,
        scopeEntityType: ADMIN_AUDIT_ENTITY_TYPES.PHARMACY_OWNER,
        scopeEntityId: ownerUserId,
        before: auditSnapshot(document),
        after: { exists: false },
        changedFields: ['exists', 'name', 'size', 'type'],
        requestId: auditRequestId,
        session,
      });
    });
  } finally {
    await session.endSession();
  }
}
