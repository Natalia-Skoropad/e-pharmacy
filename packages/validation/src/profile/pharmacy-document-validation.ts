export const PHARMACY_DOCUMENT_RULES = {
  maxFiles: 6,
  maxSizeBytes: 10 * 1024 * 1024,
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

export const PHARMACY_DOCUMENT_ACCEPT = [
  ...PHARMACY_DOCUMENT_RULES.mimeTypes,
  ...PHARMACY_DOCUMENT_RULES.extensions,
].join(',');

//===================================================================

export type PharmacyDocumentFileLike = Readonly<{
  name: string;
  size: number;
  type: string;
}>;

export type NormalizedPharmacyDocument = Readonly<{
  name: string;
  size: number;
  type: string;
}>;

//===================================================================

const MIME_TYPE_BY_EXTENSION: Readonly<Record<string, string>> = {
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx':
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

//===================================================================

function getExtension(fileName: string): string {
  const dotIndex = fileName.lastIndexOf('.');
  return dotIndex >= 0 ? fileName.slice(dotIndex).toLowerCase() : '';
}

//===================================================================

function normalizeMimeType(file: PharmacyDocumentFileLike): string {
  const type = file.type.trim().toLowerCase();

  if (type && type !== 'application/octet-stream') return type;

  return MIME_TYPE_BY_EXTENSION[getExtension(file.name)] ?? type;
}

//===================================================================

export function normalizePharmacyDocument(
  file: PharmacyDocumentFileLike
): NormalizedPharmacyDocument {
  return {
    name: file.name.trim(),
    size: file.size,
    type: normalizeMimeType(file),
  };
}

//===================================================================

export function validatePharmacyDocuments(
  files: readonly PharmacyDocumentFileLike[],
  options: Readonly<{ required?: boolean }> = {}
): string {
  if (files.length === 0) {
    return options.required
      ? 'Upload at least one document before verification.'
      : '';
  }

  if (files.length > PHARMACY_DOCUMENT_RULES.maxFiles) {
    return `You can upload up to ${PHARMACY_DOCUMENT_RULES.maxFiles} documents.`;
  }

  for (const file of files) {
    const normalized = normalizePharmacyDocument(file);
    const extension = getExtension(normalized.name);

    if (!normalized.name) return 'Document name is required.';
    if (normalized.name.length > PHARMACY_DOCUMENT_RULES.fileNameMaxLength) {
      return `Document name must be at most ${PHARMACY_DOCUMENT_RULES.fileNameMaxLength} characters.`;
    }

    if (
      !PHARMACY_DOCUMENT_RULES.extensions.some(
        (allowedExtension) => allowedExtension === extension
      ) ||
      !PHARMACY_DOCUMENT_RULES.mimeTypes.some(
        (allowedType) => allowedType === normalized.type
      )
    ) {
      return 'Choose a PDF, DOC, DOCX, JPG, PNG, or WEBP document.';
    }

    if (!Number.isInteger(normalized.size) || normalized.size < 0) {
      return 'Document size is invalid.';
    }

    if (normalized.size > PHARMACY_DOCUMENT_RULES.maxSizeBytes) {
      return `The document “${normalized.name}” must be no larger than 10 MB.`;
    }
  }

  return '';
}
