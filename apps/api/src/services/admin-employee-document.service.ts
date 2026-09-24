import mongoose, { Types, type ClientSession } from 'mongoose';

import { ADMIN_ACCESS_ERROR_CODES } from '../constants/admin-access';

import {
  ADMIN_EMPLOYEE_DOCUMENT_RULES,
  ADMIN_EMPLOYEE_DOCUMENT_VALIDATION_MESSAGES,
} from '../constants/admin-employee-document-validation';

import {
  ADMIN_AUDIT_ACTIONS,
  ADMIN_AUDIT_ENTITY_TYPES,
} from '../constants/admin-audit';

import { HTTP_STATUS } from '../constants/httpStatus';
import { AdminEmployeeDocument } from '../models/adminEmployeeDocument.model';
import type { AdminEmployeeDocumentUploadInput } from '../schemas/admin-employee-document.schema';
import type { AdminAuthorization } from '../types/admin-access';
import type { AdminEmployeeDocumentMetadataDto } from '../types/admin-employee-document';
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

function assertSelfAdminAuthorization(
  userId: string,
  authorization: AdminAuthorization
): void {
  if (authorization.userId !== userId) {
    throw httpError(
      HTTP_STATUS.FORBIDDEN,
      'Admin access does not belong to the authenticated user.',
      undefined,
      ADMIN_ACCESS_ERROR_CODES.ACCESS_REQUIRED
    );
  }
}

//===============================================================

function assertDocumentMutationAllowed(
  userId: string,
  authorization: AdminAuthorization
): void {
  assertSelfAdminAuthorization(userId, authorization);

  if (!authorization.isPlatformOwner) {
    throw httpError(
      HTTP_STATUS.FORBIDDEN,
      'Only a Platform Owner can manage admin documents.',
      undefined,
      ADMIN_ACCESS_ERROR_CODES.PLATFORM_OWNER_REQUIRED
    );
  }
}

//===============================================================

function serializeDocument(
  document: DocumentRecord
): AdminEmployeeDocumentMetadataDto {
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

async function getOwnerDocumentsForQuota(
  ownerUserId: string,
  session: ClientSession,
  excludeDocumentId?: string
): Promise<Array<{ _id: Types.ObjectId; size: number }>> {
  const filter: Record<string, unknown> = {
    ownerUserId: new Types.ObjectId(ownerUserId),
  };

  if (excludeDocumentId) {
    filter._id = { $ne: new Types.ObjectId(excludeDocumentId) };
  }

  return AdminEmployeeDocument.find(filter)
    .select('_id size')
    .session(session)
    .lean<Array<{ _id: Types.ObjectId; size: number }>>();
}

//===============================================================

function assertUploadQuota(
  existingDocuments: readonly { size: number }[],
  incomingSize: number,
  options: Readonly<{ replacing?: boolean }> = {}
): void {
  if (
    !options.replacing &&
    existingDocuments.length >= ADMIN_EMPLOYEE_DOCUMENT_RULES.maxFiles
  ) {
    throw httpError(
      HTTP_STATUS.BAD_REQUEST,
      ADMIN_EMPLOYEE_DOCUMENT_VALIDATION_MESSAGES.count
    );
  }

  const totalSizeBytes =
    existingDocuments.reduce((total, document) => total + document.size, 0) +
    incomingSize;

  if (totalSizeBytes > ADMIN_EMPLOYEE_DOCUMENT_RULES.maxTotalSizeBytes) {
    throw httpError(
      HTTP_STATUS.BAD_REQUEST,
      ADMIN_EMPLOYEE_DOCUMENT_VALIDATION_MESSAGES.totalSize
    );
  }
}

//===============================================================

export async function listMyAdminEmployeeDocumentsService(
  userId: string,
  authorization: AdminAuthorization
): Promise<AdminEmployeeDocumentMetadataDto[]> {
  assertSelfAdminAuthorization(userId, authorization);

  const documents = await AdminEmployeeDocument.find({ ownerUserId: userId })
    .select('_id name size type createdAt updatedAt')
    .sort({ createdAt: -1, _id: -1 })
    .lean<DocumentRecord[]>();

  return documents.map(serializeDocument);
}

//===============================================================

export async function getMyAdminEmployeeDocumentContentService(
  userId: string,
  authorization: AdminAuthorization,
  documentId: string
): Promise<{
  document: AdminEmployeeDocumentMetadataDto;
  content: Buffer;
}> {
  assertSelfAdminAuthorization(userId, authorization);

  const document = await AdminEmployeeDocument.findOne({
    _id: documentId,
    ownerUserId: userId,
  }).select('+content');

  if (!document?.content) {
    throw httpError(HTTP_STATUS.NOT_FOUND, 'Admin document was not found.');
  }

  return {
    document: serializeDocument(document),
    content: Buffer.from(document.content),
  };
}

//===============================================================

export async function createMyAdminEmployeeDocumentService(
  userId: string,
  authorization: AdminAuthorization,
  input: AdminEmployeeDocumentUploadInput,
  auditRequestId: string
): Promise<AdminEmployeeDocumentMetadataDto> {
  assertDocumentMutationAllowed(userId, authorization);

  const verified = decodeAndVerifyDocumentUpload(
    input,
    ADMIN_EMPLOYEE_DOCUMENT_RULES
  );

  const session = await mongoose.startSession();
  let result: AdminEmployeeDocumentMetadataDto | null = null;

  try {
    await session.withTransaction(async () => {
      const existingDocuments = await getOwnerDocumentsForQuota(
        userId,
        session
      );

      assertUploadQuota(existingDocuments, verified.size);

      const [createdDocument] = await AdminEmployeeDocument.create(
        [
          {
            ownerUserId: userId,
            uploadedByUserId: userId,
            name: input.name,
            ...verified,
          },
        ],
        { session }
      );

      result = serializeDocument(createdDocument);

      await appendAdminAuditLog({
        actorUserId: userId,
        action: ADMIN_AUDIT_ACTIONS.ADMIN_EMPLOYEE_DOCUMENT_UPLOADED,
        entityType: ADMIN_AUDIT_ENTITY_TYPES.ADMIN_EMPLOYEE_DOCUMENT,
        entityId: String(createdDocument._id),
        entityLabel: createdDocument.name,
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
    throw new Error('Admin document upload transaction did not commit.');
  }

  return result;
}

//===============================================================

export async function replaceMyAdminEmployeeDocumentService(
  userId: string,
  authorization: AdminAuthorization,
  documentId: string,
  input: AdminEmployeeDocumentUploadInput,
  auditRequestId: string
): Promise<AdminEmployeeDocumentMetadataDto> {
  assertDocumentMutationAllowed(userId, authorization);

  const verified = decodeAndVerifyDocumentUpload(
    input,
    ADMIN_EMPLOYEE_DOCUMENT_RULES
  );

  const session = await mongoose.startSession();
  let result: AdminEmployeeDocumentMetadataDto | null = null;

  try {
    await session.withTransaction(async () => {
      const document = await AdminEmployeeDocument.findOne({
        _id: documentId,
        ownerUserId: userId,
      }).session(session);

      if (!document) {
        throw httpError(HTTP_STATUS.NOT_FOUND, 'Admin document was not found.');
      }

      const before = auditSnapshot(document);
      const existingDocuments = await getOwnerDocumentsForQuota(
        userId,
        session,
        documentId
      );

      assertUploadQuota(existingDocuments, verified.size, { replacing: true });

      document.name = input.name;
      document.size = verified.size;
      document.type = verified.type;
      document.sha256 = verified.sha256;
      document.content = verified.content;
      document.uploadedByUserId = new Types.ObjectId(userId);

      await document.save({ session });
      result = serializeDocument(document);

      await appendAdminAuditLog({
        actorUserId: userId,
        action: ADMIN_AUDIT_ACTIONS.ADMIN_EMPLOYEE_DOCUMENT_REPLACED,
        entityType: ADMIN_AUDIT_ENTITY_TYPES.ADMIN_EMPLOYEE_DOCUMENT,
        entityId: String(document._id),
        entityLabel: document.name,
        before,
        after: auditSnapshot(document),
        changedFields: ['name', 'size', 'type'],
        requestId: auditRequestId,
        session,
      });
    });
  } finally {
    await session.endSession();
  }

  if (!result) {
    throw new Error('Admin document replacement transaction did not commit.');
  }

  return result;
}

//===============================================================

export async function deleteMyAdminEmployeeDocumentService(
  userId: string,
  authorization: AdminAuthorization,
  documentId: string,
  auditRequestId: string
): Promise<void> {
  assertDocumentMutationAllowed(userId, authorization);

  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const document = await AdminEmployeeDocument.findOneAndDelete(
        {
          _id: documentId,
          ownerUserId: userId,
        },
        { session }
      );

      if (!document) {
        throw httpError(HTTP_STATUS.NOT_FOUND, 'Admin document was not found.');
      }

      await appendAdminAuditLog({
        actorUserId: userId,
        action: ADMIN_AUDIT_ACTIONS.ADMIN_EMPLOYEE_DOCUMENT_DELETED,
        entityType: ADMIN_AUDIT_ENTITY_TYPES.ADMIN_EMPLOYEE_DOCUMENT,
        entityId: String(document._id),
        entityLabel: document.name,
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
