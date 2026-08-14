import { createHash, randomBytes } from 'node:crypto';
import mongoose, { type ClientSession, type Types } from 'mongoose';

import { HTTP_STATUS } from '../constants/httpStatus';
import { PHARMACY_DOCUMENT_RULES } from '../constants/pharmacy-document-validation';
import { PharmacyDocumentFile } from '../models/pharmacyDocumentFile.model';
import { PharmacyRegistrationUploadSession } from '../models/pharmacyRegistrationUploadSession.model';

import type {
  PharmacyDocumentUploadInput,
  PharmacyRegistrationDocumentUploadInput,
  PharmacyProfileDocumentSelectionInput,
  PharmacyRegistrationDocumentClaimInput,
} from '../schemas/shared/pharmacy-document.schema';

import type { PharmacyVerificationDocumentMetadata } from '../types/pharmacy';
import { httpError } from '../utils/httpError';
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

function decodeBase64DataUrl(dataUrl: string): {
  content: Buffer;
  declaredDataUrlType: string;
} {
  const match = /^data:([^;,]+);base64,([A-Za-z0-9+/=]+)$/i.exec(dataUrl);

  if (!match) {
    throw httpError(HTTP_STATUS.BAD_REQUEST, 'Document content is invalid.');
  }

  try {
    const content = Buffer.from(match[2], 'base64');
    if (content.toString('base64') !== match[2]) {
      throw new Error('Non-canonical base64');
    }

    return {
      content,
      declaredDataUrlType: match[1].trim().toLowerCase(),
    };
  } catch {
    throw httpError(HTTP_STATUS.BAD_REQUEST, 'Document content is invalid.');
  }
}

//===================================================================

function hasPrefix(buffer: Buffer, bytes: readonly number[]): boolean {
  if (buffer.length < bytes.length) return false;
  return bytes.every((byte, index) => buffer[index] === byte);
}

//===================================================================

function hasAscii(buffer: Buffer, offset: number, value: string): boolean {
  return (
    buffer.length >= offset + value.length &&
    buffer.subarray(offset, offset + value.length).toString('ascii') === value
  );
}

//===================================================================

function detectDocumentMimeType(
  buffer: Buffer,
  declaredType: string
): string | null {
  if (hasAscii(buffer, 0, '%PDF-')) return 'application/pdf';
  if (hasPrefix(buffer, [0xff, 0xd8, 0xff])) return 'image/jpeg';
  if (hasPrefix(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return 'image/png';
  }

  if (hasAscii(buffer, 0, 'RIFF') && hasAscii(buffer, 8, 'WEBP')) {
    return 'image/webp';
  }

  if (hasPrefix(buffer, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])) {
    return 'application/msword';
  }

  if (hasPrefix(buffer, [0x50, 0x4b, 0x03, 0x04])) {
    const looksLikeDocx =
      buffer.includes(Buffer.from('[Content_Types].xml')) &&
      buffer.includes(Buffer.from('word/'));

    return declaredType ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document' &&
      looksLikeDocx
      ? declaredType
      : null;
  }

  return null;
}

//===================================================================

function hasExpectedFileExtension(name: string, type: string): boolean {
  const extension = name.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1];
  const allowedExtensions: Record<string, readonly string[]> = {
    'application/pdf': ['pdf'],
    'application/msword': ['doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
      'docx',
    ],
    'image/jpeg': ['jpg', 'jpeg'],
    'image/png': ['png'],
    'image/webp': ['webp'],
  };

  return Boolean(extension && allowedExtensions[type]?.includes(extension));
}

//===================================================================

function decodeAndVerifyUpload(input: PharmacyDocumentUploadInput): {
  content: Buffer;
  size: number;
  type: string;
  sha256: string;
} {
  const { content, declaredDataUrlType } = decodeBase64DataUrl(input.dataUrl);
  const size = content.byteLength;

  if (declaredDataUrlType !== input.type.toLowerCase()) {
    throw httpError(
      HTTP_STATUS.BAD_REQUEST,
      'Document MIME type does not match the upload payload.'
    );
  }

  if (
    size !== input.size ||
    size <= 0 ||
    size > PHARMACY_DOCUMENT_RULES.maxSizeBytes
  ) {
    throw httpError(
      HTTP_STATUS.BAD_REQUEST,
      'Document size does not match the uploaded content.'
    );
  }

  const detectedType = detectDocumentMimeType(content, input.type);
  if (
    !detectedType ||
    detectedType !== input.type ||
    !hasExpectedFileExtension(input.name, detectedType)
  ) {
    throw httpError(
      HTTP_STATUS.BAD_REQUEST,
      'Document MIME type does not match the uploaded content.'
    );
  }

  return {
    content,
    size,
    type: detectedType,
    sha256: createHash('sha256').update(content).digest('hex'),
  };
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
  const verified = decodeAndVerifyUpload(input);
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

export async function createPrivatePharmacyDocumentUploadService(
  userId: string,
  input: PharmacyDocumentUploadInput
): Promise<{ document: PharmacyVerificationDocumentMetadata }> {
  const { pharmacy } = await findPharmacyForProfileAccess(
    userId,
    'manage_documents'
  );

  const verified = decodeAndVerifyUpload(input);

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

  const query = PharmacyDocumentFile.find({
    _id: { $in: ids },
    pharmacyId,
  });

  if (session) query.session(session);
  const documents = await query;

  const byId = new Map(
    documents.map((document) => [String(document._id), document])
  );

  const ordered = ids.map((id) => byId.get(id));

  if (ordered.some((document) => !document)) {
    throw httpError(
      HTTP_STATUS.BAD_REQUEST,
      'One or more pharmacy documents are unavailable.'
    );
  }

  await PharmacyDocumentFile.updateMany(
    { _id: { $in: ids }, pharmacyId },
    {
      $set: { attachedAt: new Date() },
      $unset: { expiresAt: '' },
    },
    { session }
  );

  return ordered.map((document) => serializeDocument(document!));
}

//===================================================================

export async function getPrivatePharmacyDocumentContentService(
  userId: string,
  documentId: string
): Promise<{
  document: PharmacyVerificationDocumentMetadata;
  dataUrl: string;
}> {
  const { pharmacy } = await findPharmacyForProfileAccess(
    userId,
    'manage_documents'
  );

  const document = await PharmacyDocumentFile.findOne({
    _id: documentId,
    pharmacyId: pharmacy._id,
  }).select('+content');

  if (!document?.content) {
    throw httpError(HTTP_STATUS.NOT_FOUND, 'Pharmacy document was not found.');
  }

  return serializeDocumentContent(document);
}

//===================================================================

export async function getAdminPharmacyDocumentContentService(
  pharmacyId: string,
  documentId: string
): Promise<{
  document: PharmacyVerificationDocumentMetadata;
  dataUrl: string;
}> {
  const document = await PharmacyDocumentFile.findOne({
    _id: documentId,
    pharmacyId,
    attachedAt: { $exists: true },
  }).select('+content');

  if (!document?.content) {
    throw httpError(HTTP_STATUS.NOT_FOUND, 'Pharmacy document was not found.');
  }

  return serializeDocumentContent(document);
}
