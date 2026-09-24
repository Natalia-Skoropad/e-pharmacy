export type DocumentFileLike = Readonly<{
  name: string;
  size: number;
  type: string;
}>;

export type DocumentFileRules = Readonly<{
  maxFiles: number;
  maxSizeBytes: number;
  maxTotalSizeBytes: number;
  fileNameMaxLength: number;
  mimeTypes: readonly string[];
  extensions: readonly string[];
}>;

export type DocumentValidationMessages = Readonly<{
  required: string;
  count: string;
  totalSize: string;
  nameLength: string;
  format: string;
  invalidSize: string;
  fileSize: (fileName: string) => string;
}>;

export type NormalizedDocumentFile = Readonly<{
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

function normalizeMimeType(file: DocumentFileLike): string {
  const type = file.type.trim().toLowerCase();

  if (type && type !== 'application/octet-stream') return type;

  return MIME_TYPE_BY_EXTENSION[getExtension(file.name)] ?? type;
}

//===================================================================

export function normalizeDocumentFile(
  file: DocumentFileLike
): NormalizedDocumentFile {
  return {
    name: file.name.trim(),
    size: file.size,
    type: normalizeMimeType(file),
  };
}

//===================================================================

export function buildDocumentAccept(rules: DocumentFileRules): string {
  return [...rules.mimeTypes, ...rules.extensions].join(',');
}

//===================================================================

export function validateDocumentFiles(
  files: readonly DocumentFileLike[],
  rules: DocumentFileRules,
  messages: DocumentValidationMessages,
  options: Readonly<{ required?: boolean }> = {}
): string {
  if (files.length === 0) {
    return options.required ? messages.required : '';
  }

  if (files.length > rules.maxFiles) return messages.count;

  const totalSizeBytes = files.reduce((sum, file) => sum + file.size, 0);
  if (totalSizeBytes > rules.maxTotalSizeBytes) return messages.totalSize;

  for (const file of files) {
    const normalized = normalizeDocumentFile(file);
    const extension = getExtension(normalized.name);

    if (!normalized.name) return messages.required;
    if (normalized.name.length > rules.fileNameMaxLength) {
      return messages.nameLength;
    }

    if (
      !rules.extensions.includes(extension) ||
      !rules.mimeTypes.includes(normalized.type)
    ) {
      return messages.format;
    }

    if (!Number.isInteger(normalized.size) || normalized.size <= 0) {
      return messages.invalidSize;
    }

    if (normalized.size > rules.maxSizeBytes) {
      return messages.fileSize(normalized.name);
    }
  }

  return '';
}
