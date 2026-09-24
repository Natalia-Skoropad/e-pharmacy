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
  fileNamePattern: /\.(?:pdf|docx?|jpe?g|png|webp)$/i,
} as const;

//===============================================================

export const ADMIN_EMPLOYEE_DOCUMENT_VALIDATION_MESSAGES = {
  requiredName: 'Document name is required',
  format: 'Choose a PDF, DOC, DOCX, JPG, PNG, or WEBP document',
  size: 'Document must be no larger than 10 MB',
  count: `An admin profile can contain at most ${ADMIN_EMPLOYEE_DOCUMENT_RULES.maxFiles} documents`,
  totalSize: 'Admin documents must be no larger than 30 MB in total',
  nameLength: `Document name must be at most ${ADMIN_EMPLOYEE_DOCUMENT_RULES.fileNameMaxLength} characters`,
} as const;
