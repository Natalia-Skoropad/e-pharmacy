import {
  buildDocumentAccept,
  normalizeDocumentFile,
  validateDocumentFiles,
  type DocumentFileLike,
  type NormalizedDocumentFile,
} from './document-file-validation';

//===================================================================

export const PHARMACY_OWNER_DOCUMENT_RULES = {
  maxFiles: 6,
  maxSizeBytes: 10 * 1024 * 1024,
  maxTotalSizeBytes: 30 * 1024 * 1024,
  fileNameMaxLength: 180,

  mimeTypes: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'image/webp',
  ],

  extensions: ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.webp'],
} as const;

//===================================================================

export const PHARMACY_OWNER_DOCUMENT_ACCEPT = buildDocumentAccept(
  PHARMACY_OWNER_DOCUMENT_RULES
);

export type PharmacyOwnerDocumentFileLike = DocumentFileLike;
export type NormalizedPharmacyOwnerDocument = NormalizedDocumentFile;

//===================================================================

export function normalizePharmacyOwnerDocument(
  file: PharmacyOwnerDocumentFileLike
): NormalizedPharmacyOwnerDocument {
  return normalizeDocumentFile(file);
}

//===================================================================

export function validatePharmacyOwnerDocuments(
  files: readonly PharmacyOwnerDocumentFileLike[]
): string {
  return validateDocumentFiles(files, PHARMACY_OWNER_DOCUMENT_RULES, {
    required: 'Upload at least one owner document',
    count: `You can upload up to ${PHARMACY_OWNER_DOCUMENT_RULES.maxFiles} owner documents`,
    totalSize: 'Owner documents must be no larger than 30 MB in total',
    nameLength: `Document name must be at most ${PHARMACY_OWNER_DOCUMENT_RULES.fileNameMaxLength} characters`,
    format: 'Choose a PDF, DOC, DOCX, JPG, PNG, or WEBP document',

    invalidSize: 'Document size is invalid',
    fileSize: (fileName) =>
      `The document “${fileName}” must be no larger than 10 MB`,
  });
}
