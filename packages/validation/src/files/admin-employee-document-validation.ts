import {
  buildDocumentAccept,
  normalizeDocumentFile,
  validateDocumentFiles,
  type DocumentFileLike,
  type NormalizedDocumentFile,
} from './document-file-validation';

//===================================================================

export const ADMIN_EMPLOYEE_DOCUMENT_RULES = {
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

export const ADMIN_EMPLOYEE_DOCUMENT_ACCEPT = buildDocumentAccept(
  ADMIN_EMPLOYEE_DOCUMENT_RULES
);

//===================================================================

export type AdminEmployeeDocumentFileLike = DocumentFileLike;
export type NormalizedAdminEmployeeDocument = NormalizedDocumentFile;

//===================================================================

export function normalizeAdminEmployeeDocument(
  file: AdminEmployeeDocumentFileLike
): NormalizedAdminEmployeeDocument {
  return normalizeDocumentFile(file);
}

//===================================================================

export function validateAdminEmployeeDocuments(
  files: readonly AdminEmployeeDocumentFileLike[],
  options: Readonly<{ required?: boolean }> = {}
): string {
  return validateDocumentFiles(
    files,
    ADMIN_EMPLOYEE_DOCUMENT_RULES,
    {
      required: 'Select at least one document.',
      count: `You can upload up to ${ADMIN_EMPLOYEE_DOCUMENT_RULES.maxFiles} documents`,
      totalSize: 'Admin documents must be no larger than 30 MB in total',
      nameLength: `Document name must be at most ${ADMIN_EMPLOYEE_DOCUMENT_RULES.fileNameMaxLength} characters`,
      format: 'Choose a PDF, DOC, DOCX, JPG, PNG, or WEBP document',
      invalidSize: 'Document size is invalid',
      fileSize: (fileName) =>
        `The document “${fileName}” must be no larger than 10 MB`,
    },
    options
  );
}
