import { createHash, randomBytes } from 'node:crypto';
import mongoose, { Types, type ClientSession } from 'mongoose';

import { HTTP_STATUS } from '../../constants/http/httpStatus';
import { canPharmacyProfilePerformAction } from '../../constants/pharmacies/pharmacy-profile';
import { PHARMACY_DOCUMENT_RULES } from '../../constants/pharmacies/pharmacy-document-validation';
import { PHARMACY_OWNER_DOCUMENT_RULES } from '../../constants/owners/pharmacy-owner-document-validation';

import { PharmacyDocumentFile } from '../../models/pharmacies/pharmacyDocumentFile.model';
import { PharmacyOwnerDocument } from '../../models/owners/pharmacyOwnerDocument.model';
import { Pharmacy } from '../../models/pharmacies/pharmacy.model';
import { PharmacyRegistrationUploadSession } from '../../models/owners/pharmacyRegistrationUploadSession.model';

import type {
  PharmacyDocumentUploadInput,
  PharmacyRegistrationDocumentUploadInput,
  PharmacyProfileDocumentSelectionInput,
  PharmacyRegistrationDocumentClaimInput,
} from '../../schemas/shared/pharmacy-document.schema';

import type { PharmacyVerificationDocumentMetadata } from '../../types/pharmacies/pharmacy';
import type { AdminPharmacyDocumentDto } from '../../types/admin/pharmacies/admin-pharmacy-document';

import { httpError } from '../../utils/http/httpError';
import { decodeAndVerifyDocumentUpload } from '../../utils/documents/documentUpload';

import { findPharmacyForProfileAccess } from './pharmacy-membership.service';

//===================================================================

const REGISTRATION_UPLOAD_TTL_MS = 60 * 60 * 1000;
const PRIVATE_UPLOAD_TTL_MS = 24 * 60 * 60 * 1000;
const CLAIM_TOKEN_BYTES = 32;
const UPLOAD_SESSION_TOKEN_BYTES = 32;

//===================================================================

function hashClaimToken(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

//===================================================================

function hashUploadSessionToken(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

//===================================================================

function serializeDocument(document: {
  _id: Types.ObjectId;
  name: string;
  size: number;
  type: string;
  sha256: string;
  createdAt: Date;
}): PharmacyVerificationDocumentMetadata {
  return {
    id: String(document._id),
    name: document.name,
    size: document.size,
    type: document.type,
    sha256: document.sha256,
    uploadedAt: document.createdAt.toISOString(),
  };
}

//===================================================================

function serializeDocumentContent(document: {
  _id: Types.ObjectId;
  name: string;
  size: number;
  type: string;
  sha256: string;
  createdAt: Date;
  content: Buffer;
}): {
  document: PharmacyVerificationDocumentMetadata;
  dataUrl: string;
} {
  return {
    document: serializeDocument(document),
    dataUrl: `data:${document.type};base64,${document.content.toString('base64')}`,
  };
}

//===================================================================

export async function createRegistrationPharmacyDocumentUploadSessionService(): Promise<{
  uploadSessionId: string;
  uploadToken: string;
  expiresAt: string;
  maxFiles: number;
  maxTotalSizeBytes: number;
}> {
  const uploadToken = randomBytes(UPLOAD_SESSION_TOKEN_BYTES).toString('hex');
  const expiresAt = new Date(Date.now() + REGISTRATION_UPLOAD_TTL_MS);

  const uploadSession = await PharmacyRegistrationUploadSession.create({
    tokenHash: hashUploadSessionToken(uploadToken),
    uploadedFiles: 0,
    uploadedBytes: 0,
    expiresAt,
  });

  return {
    uploadSessionId: String(uploadSession._id),
    uploadToken,
    expiresAt: expiresAt.toISOString(),
    maxFiles: PHARMACY_DOCUMENT_RULES.maxFiles,
    maxTotalSizeBytes: PHARMACY_DOCUMENT_RULES.maxTotalSizeBytes,
  };
}

//===================================================================

export async function createRegistrationPharmacyDocumentUploadService(
  input: PharmacyRegistrationDocumentUploadInput
): Promise<{
  document: PharmacyVerificationDocumentMetadata;
  claimToken: string;
}> {
  const verified = decodeAndVerifyDocumentUpload(
    input,
    PHARMACY_DOCUMENT_RULES
  );

  const claimToken = randomBytes(CLAIM_TOKEN_BYTES).toString('hex');
  const mongoSession = await mongoose.startSession();

  let document: PharmacyVerificationDocumentMetadata | null = null;

  try {
    await mongoSession.withTransaction(async () => {
      const now = new Date();

      const maxBytesBeforeUpload =
        PHARMACY_DOCUMENT_RULES.maxTotalSizeBytes - verified.size;

      const uploadSession =
        await PharmacyRegistrationUploadSession.findOneAndUpdate(
          {
            _id: input.uploadSessionId,
            tokenHash: hashUploadSessionToken(input.uploadToken),
            expiresAt: { $gt: now },
            uploadedFiles: { $lt: PHARMACY_DOCUMENT_RULES.maxFiles },
            uploadedBytes: { $lte: maxBytesBeforeUpload },
          },
          {
            $inc: {
              uploadedFiles: 1,
              uploadedBytes: verified.size,
            },
          },
          { new: true, session: mongoSession }
        );

      if (!uploadSession) {
        throw httpError(
          HTTP_STATUS.BAD_REQUEST,
          'Pharmacy registration upload session is invalid, expired, or has reached its document quota.'
        );
      }

      const [createdDocument] = await PharmacyDocumentFile.create(
        [
          {
            name: input.name,

            ...verified,

            claimTokenHash: hashClaimToken(claimToken),
            registrationUploadSessionId: uploadSession._id,
            expiresAt: new Date(Date.now() + REGISTRATION_UPLOAD_TTL_MS),
          },
        ],
        { session: mongoSession }
      );

      document = serializeDocument(createdDocument);
    });
  } finally {
    await mongoSession.endSession();
  }

  if (!document) {
    throw new Error('Registration document upload transaction did not commit.');
  }

  return {
    document,
    claimToken,
  };
}

//===================================================================

export async function claimRegistrationPharmacyDocuments(
  claims: readonly PharmacyRegistrationDocumentClaimInput[],
  pharmacyId: Types.ObjectId,
  userId: Types.ObjectId,
  session: ClientSession
): Promise<PharmacyVerificationDocumentMetadata[]> {
  const documents: PharmacyVerificationDocumentMetadata[] = [];

  let uploadSessionId: string | null | undefined;
  let totalSizeBytes = 0;

  for (const claim of claims) {
    const document = await PharmacyDocumentFile.findOneAndUpdate(
      {
        _id: claim.documentId,
        claimTokenHash: hashClaimToken(claim.claimToken),
        pharmacyId: { $exists: false },
        expiresAt: { $gt: new Date() },
      },
      {
        $set: {
          pharmacyId,
          uploadedByUserId: userId,
          attachedAt: new Date(),
        },

        $unset: {
          claimTokenHash: '',
          expiresAt: '',
        },
      },
      { new: true, session }
    );

    if (!document) {
      throw httpError(
        HTTP_STATUS.BAD_REQUEST,
        'A pharmacy registration document is invalid or has expired.'
      );
    }

    const documentUploadSessionId = document.registrationUploadSessionId
      ? String(document.registrationUploadSessionId)
      : null;

    if (uploadSessionId === undefined) {
      uploadSessionId = documentUploadSessionId;
    } else if (uploadSessionId !== documentUploadSessionId) {
      throw httpError(
        HTTP_STATUS.BAD_REQUEST,
        'Pharmacy registration documents must belong to one upload session.'
      );
    }

    totalSizeBytes += document.size;

    if (totalSizeBytes > PHARMACY_DOCUMENT_RULES.maxTotalSizeBytes) {
      throw httpError(
        HTTP_STATUS.BAD_REQUEST,
        'Pharmacy registration documents exceed the total upload quota.'
      );
    }

    documents.push(serializeDocument(document));
  }

  if (uploadSessionId) {
    await PharmacyRegistrationUploadSession.deleteOne(
      { _id: uploadSessionId },
      { session }
    );
  }

  return documents;
}

//===================================================================

// Registration uploads are temporary PharmacyDocumentFile records for legacy API
// compatibility. Transfer the bytes into the canonical Owner collection when
// creating the user; do not attach any Pharmacy or create a pharmacy record.
// This function must run inside the same transaction as User creation.
export async function claimRegistrationOwnerDocuments(
  claims: readonly PharmacyRegistrationDocumentClaimInput[],
  ownerUserId: Types.ObjectId,
  session: ClientSession
): Promise<Array<{ name: string; size: number; type: string }>> {
  if (
    claims.length < 1 ||
    claims.length > PHARMACY_OWNER_DOCUMENT_RULES.maxFiles
  ) {
    throw httpError(
      HTTP_STATUS.BAD_REQUEST,
      'Owner documents are required (up to six files).'
    );
  }

  const attached: Array<{ name: string; size: number; type: string }> = [];
  const seenIds = new Set<string>();

  let uploadSessionId: string | null = null;
  let totalSizeBytes = 0;

  for (const claim of claims) {
    if (seenIds.has(claim.documentId)) {
      throw httpError(
        HTTP_STATUS.BAD_REQUEST,
        'Duplicate owner document claim.'
      );
    }

    seenIds.add(claim.documentId);

    // A claim is single-use and can only consume a temporary, unowned,
    // unexpired upload from the authenticated registration session.
    const document = await PharmacyDocumentFile.findOneAndDelete(
      {
        _id: claim.documentId,
        claimTokenHash: hashClaimToken(claim.claimToken),
        registrationUploadSessionId: { $exists: true },
        pharmacyId: { $exists: false },
        uploadedByUserId: { $exists: false },
        expiresAt: { $gt: new Date() },
      },
      { session }
    ).select('+content');

    if (!document?.content || !document.registrationUploadSessionId) {
      throw httpError(
        HTTP_STATUS.BAD_REQUEST,
        'An owner registration document is invalid or has expired.'
      );
    }

    const currentSessionId = String(document.registrationUploadSessionId);

    if (uploadSessionId !== null && uploadSessionId !== currentSessionId) {
      throw httpError(
        HTTP_STATUS.BAD_REQUEST,
        'Owner documents must belong to one upload session.'
      );
    }

    uploadSessionId = currentSessionId;

    totalSizeBytes += document.size;

    if (
      document.size > PHARMACY_OWNER_DOCUMENT_RULES.maxSizeBytes ||
      totalSizeBytes > PHARMACY_OWNER_DOCUMENT_RULES.maxTotalSizeBytes ||
      !PHARMACY_OWNER_DOCUMENT_RULES.mimeTypes.some(
        (mime) => mime === document.type
      ) ||
      !PHARMACY_OWNER_DOCUMENT_RULES.fileNamePattern.test(document.name) ||
      document.content.length !== document.size ||
      createHash('sha256').update(document.content).digest('hex') !==
        document.sha256
    ) {
      throw httpError(
        HTTP_STATUS.BAD_REQUEST,
        'Owner registration document failed integrity validation.'
      );
    }

    await PharmacyOwnerDocument.create(
      [
        {
          _id: document._id,
          ownerUserId,
          uploadedByUserId: ownerUserId,
          name: document.name,
          size: document.size,
          type: document.type,
          sha256: document.sha256,
          content: Buffer.from(document.content),
        },
      ],
      { session }
    );

    attached.push({
      name: document.name,
      size: document.size,
      type: document.type,
    });
  }

  if (!uploadSessionId) {
    throw httpError(
      HTTP_STATUS.BAD_REQUEST,
      'Owner registration upload session is missing.'
    );
  }

  // Session deletion and all claims roll back on any subsequent error.
  const result = await PharmacyRegistrationUploadSession.deleteOne(
    { _id: uploadSessionId, expiresAt: { $gt: new Date() } },
    { session }
  );

  if (result.deletedCount !== 1) {
    throw httpError(
      HTTP_STATUS.BAD_REQUEST,
      'Owner registration upload session has expired.'
    );
  }

  return attached;
}

//===================================================================

export async function createPrivatePharmacyDocumentUploadService(
  userId: string,
  input: PharmacyDocumentUploadInput,
  pharmacyId?: string
): Promise<{ document: PharmacyVerificationDocumentMetadata }> {
  const { pharmacy } = await findPharmacyForProfileAccess(
    userId,
    'manage_documents',
    undefined,
    pharmacyId
  );

  if (
    !canPharmacyProfilePerformAction(
      pharmacy.status,
      'edit',
      pharmacy.reviewState
    )
  ) {
    throw httpError(
      HTTP_STATUS.CONFLICT,
      'Pharmacy documents cannot be modified while under review.'
    );
  }

  const verified = decodeAndVerifyDocumentUpload(
    input,
    PHARMACY_DOCUMENT_RULES
  );

  const document = await PharmacyDocumentFile.create({
    name: input.name,

    ...verified,

    pharmacyId: pharmacy._id,
    uploadedByUserId: userId,
    expiresAt: new Date(Date.now() + PRIVATE_UPLOAD_TTL_MS),
  });

  return { document: serializeDocument(document) };
}

//===================================================================

export async function resolvePrivatePharmacyDocumentSelections(
  pharmacyId: Types.ObjectId,
  selections: readonly PharmacyProfileDocumentSelectionInput[],
  session?: ClientSession
): Promise<PharmacyVerificationDocumentMetadata[]> {
  const ids = selections.map((selection) => selection.documentId);

  if (new Set(ids).size !== ids.length) {
    throw httpError(HTTP_STATUS.BAD_REQUEST, 'Duplicate pharmacy document.');
  }

  const now = new Date();

  const selectableDocumentFilter = {
    _id: { $in: ids },
    pharmacyId,
    $or: [{ attachedAt: { $exists: true } }, { expiresAt: { $gt: now } }],
  };

  const query = PharmacyDocumentFile.find(selectableDocumentFilter);

  if (session) query.session(session);

  const documents = await query;

  const byId = new Map(
    documents.map((document) => [String(document._id), document])
  );

  // Older seeded/migrated pharmacy documents may be stored as trusted
  // metadata directly on this pharmacy, without a PharmacyDocumentFile row.
  // Reattaching them must not fail. Never accept an arbitrary client-supplied
  // document ID: the fallback is limited to this pharmacy's saved metadata.
  const pharmacyQuery = Pharmacy.findById(pharmacyId).select(
    'documents pendingModeration.documents'
  );

  if (session) pharmacyQuery.session(session);

  const existingPharmacy = await pharmacyQuery;

  const trustedAttached = new Map(
    [
      ...(existingPharmacy?.documents ?? []),
      ...(existingPharmacy?.pendingModeration?.documents ?? []),
    ].map((document) => [document.id, document])
  );

  const ordered = ids.map((id) => ({
    uploaded: byId.get(id),
    attached: trustedAttached.get(id),
  }));

  if (ordered.some(({ uploaded, attached }) => !uploaded && !attached)) {
    throw httpError(
      HTTP_STATUS.BAD_REQUEST,
      'One or more pharmacy documents are unavailable.'
    );
  }

  await PharmacyDocumentFile.updateMany(
    selectableDocumentFilter,
    {
      $set: { attachedAt: now },
      $unset: { expiresAt: '' },
    },
    { session }
  );

  return ordered.map(({ uploaded, attached }) =>
    uploaded ? serializeDocument(uploaded) : attached!
  );
}

//===================================================================

export async function reconcileAttachedPharmacyDocumentStorage(
  pharmacyId: Types.ObjectId,
  currentDocuments: readonly PharmacyVerificationDocumentMetadata[],
  pendingDocuments: readonly PharmacyVerificationDocumentMetadata[] | undefined,
  session?: ClientSession
): Promise<void> {
  const uniqueReferencedDocumentIds = [
    ...new Set(
      [...currentDocuments, ...(pendingDocuments ?? [])].map(
        (document) => document.id
      )
    ),
  ].map((documentId) => new Types.ObjectId(documentId));

  const orphanedAttachedDocumentsFilter = {
    pharmacyId,
    attachedAt: { $exists: true },

    ...(uniqueReferencedDocumentIds.length > 0
      ? { _id: { $nin: uniqueReferencedDocumentIds } }
      : {}),
  };

  await PharmacyDocumentFile.deleteMany(orphanedAttachedDocumentsFilter, {
    session,
  });
}

//===================================================================

export async function getPrivatePharmacyDocumentContentService(
  userId: string,
  documentId: string,
  pharmacyId?: string
): Promise<{
  document: PharmacyVerificationDocumentMetadata;
  content: Buffer;
}> {
  const { pharmacy } = await findPharmacyForProfileAccess(
    userId,
    'manage_documents',
    undefined,
    pharmacyId
  );

  const document = await PharmacyDocumentFile.findOne({
    _id: documentId,
    pharmacyId: pharmacy._id,

    $or: [
      { attachedAt: { $exists: true } },
      { expiresAt: { $gt: new Date() } },
    ],
  }).select('+content');

  if (!document?.content) {
    throw httpError(HTTP_STATUS.NOT_FOUND, 'Pharmacy document was not found.');
  }

  return {
    document: serializeDocument(document),
    content: Buffer.from(document.content),
  };
}

//===================================================================

type PharmacyDocumentReferences = {
  documents?: PharmacyVerificationDocumentMetadata[];
  pendingModeration?: { documents?: PharmacyVerificationDocumentMetadata[] };
};

//===================================================================

function referencedDocuments(pharmacy: PharmacyDocumentReferences) {
  const result: AdminPharmacyDocumentDto[] = [];
  const seen = new Set<string>();

  for (const [source, entries] of [
    ['published', pharmacy.documents ?? []],
    ['pending', pharmacy.pendingModeration?.documents ?? []],
  ] as const) {
    for (const entry of entries) {
      if (!/^[a-f0-9]{24}$/i.test(entry.id) || seen.has(entry.id)) continue;

      seen.add(entry.id);

      result.push({
        id: entry.id,
        name: entry.name,
        size: entry.size,
        type: entry.type,
        uploadedAt: entry.uploadedAt,
        source,
      });
    }
  }

  return result;
}

//===================================================================

async function getPharmacyDocumentReferences(pharmacyId: string) {
  if (!Types.ObjectId.isValid(pharmacyId)) {
    throw httpError(HTTP_STATUS.NOT_FOUND, 'Pharmacy was not found.');
  }

  const pharmacy = await Pharmacy.findById(pharmacyId)
    .select('documents pendingModeration.documents')
    .lean<PharmacyDocumentReferences | null>();

  if (!pharmacy)
    throw httpError(HTTP_STATUS.NOT_FOUND, 'Pharmacy was not found.');

  return referencedDocuments(pharmacy);
}

//===================================================================

// Metadata is taken from the Pharmacy's published/pending references, but only
// actually attached files owned by this exact pharmacy can be listed/downloaded.
export async function listAdminPharmacyDocumentsService(
  pharmacyId: string
): Promise<AdminPharmacyDocumentDto[]> {
  const entries = await getPharmacyDocumentReferences(pharmacyId);

  if (entries.length === 0) return [];

  const attached = await PharmacyDocumentFile.find({
    pharmacyId,
    attachedAt: { $exists: true },
    _id: { $in: entries.map((entry) => new Types.ObjectId(entry.id)) },
  })
    .select('_id')
    .lean<Array<{ _id: Types.ObjectId }>>();

  const ids = new Set(attached.map((row) => String(row._id)));

  return entries.filter((entry) => ids.has(entry.id));
}

//===================================================================

async function readAdminPharmacyDocument(
  pharmacyId: string,
  documentId: string
) {
  const referenced = await getPharmacyDocumentReferences(pharmacyId);

  if (!referenced.some((entry) => entry.id === documentId)) {
    throw httpError(HTTP_STATUS.NOT_FOUND, 'Pharmacy document was not found.');
  }

  const file = await PharmacyDocumentFile.findOne({
    _id: documentId,
    pharmacyId, // never trust documentId alone or the owner of another pharmacy
    attachedAt: { $exists: true },
  }).select('+content');

  if (!file?.content) {
    throw httpError(HTTP_STATUS.NOT_FOUND, 'Pharmacy document was not found.');
  }

  return file;
}

//===================================================================

/** Legacy service result retained for existing internal consumers/tests. */
export async function getAdminPharmacyDocumentContentService(
  pharmacyId: string,
  documentId: string
): Promise<{
  document: PharmacyVerificationDocumentMetadata;
  dataUrl: string;
}> {
  const document = await readAdminPharmacyDocument(pharmacyId, documentId);

  return serializeDocumentContent(document);
}

//===================================================================

/** Streaming-ready binary download, never expose the base64 payload to Admin JSON. */
export async function downloadAdminPharmacyDocumentService(
  pharmacyId: string,
  documentId: string
): Promise<{
  document: PharmacyVerificationDocumentMetadata;
  content: Buffer;
}> {
  const document = await readAdminPharmacyDocument(pharmacyId, documentId);

  return {
    document: serializeDocument(document),
    content: Buffer.from(document.content),
  };
}
