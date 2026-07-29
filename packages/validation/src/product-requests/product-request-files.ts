import type { ProductRequestFile } from '@e-pharmacy/types/product-requests';

import {
  PRODUCT_REQUEST_ATTACHMENT_RULES,
  PRODUCT_REQUEST_IMAGE_RULES,
  PRODUCT_REQUEST_LIMITS,
  PRODUCT_REQUEST_VALIDATION_MESSAGES,
} from './product-request-constants';

import type { ProductRequestFileLike } from './product-request-types';

//===================================================================

const PRODUCT_REQUEST_FILE_MIME_TYPES_BY_EXTENSION: Readonly<
  Record<string, string>
> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx':
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

//===================================================================

function getFileExtension(fileName: string): string {
  const extensionIndex = fileName.lastIndexOf('.');

  return extensionIndex >= 0
    ? fileName.slice(extensionIndex).toLowerCase()
    : '';
}

//===================================================================

function getNormalizedFileMimeType(file: ProductRequestFileLike): string {
  const normalizedType = file.type.trim().toLowerCase();

  if (normalizedType && normalizedType !== 'application/octet-stream') {
    return normalizedType;
  }

  return (
    PRODUCT_REQUEST_FILE_MIME_TYPES_BY_EXTENSION[getFileExtension(file.name)] ??
    'application/octet-stream'
  );
}

//===================================================================

function isAllowedFile(
  file: ProductRequestFileLike,
  mimeTypes: readonly string[],
  extensions: readonly string[]
): boolean {
  const extension = getFileExtension(file.name);
  const normalizedType = getNormalizedFileMimeType(file);

  return extensions.includes(extension) && mimeTypes.includes(normalizedType);
}

//===================================================================

function getDataUrlMimeType(dataUrl: string): string | null {
  const match = dataUrl.match(/^data:([^;,]+);base64,/i);
  return match?.[1]?.toLowerCase() ?? null;
}

//===================================================================

function getDataUrlByteSize(dataUrl: string): number | null {
  const commaIndex = dataUrl.indexOf(',');
  if (commaIndex < 0) return null;

  const base64 = dataUrl.slice(commaIndex + 1);
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;

  return Math.floor((base64.length * 3) / 4) - padding;
}

//===================================================================

function validateFileMetadata(file: ProductRequestFileLike): string {
  const fileName = file.name.trim();
  const fileType = file.type.trim();

  if (!fileName) return 'File name is required';
  if (fileName.length > PRODUCT_REQUEST_LIMITS.fileNameMax) {
    return PRODUCT_REQUEST_VALIDATION_MESSAGES.limits.fileName;
  }
  if (fileType.length > PRODUCT_REQUEST_LIMITS.fileTypeMax) {
    return PRODUCT_REQUEST_VALIDATION_MESSAGES.limits.fileType;
  }
  if (!Number.isInteger(file.size) || file.size < 0) {
    return PRODUCT_REQUEST_VALIDATION_MESSAGES.limits.fileSize;
  }

  return '';
}

//===================================================================

function validateDataUrl(
  file: ProductRequestFileLike,
  maxLength: number,
  maxSizeBytes: number,
  tooLargeMessage: string
): string {
  if (!file.dataUrl) return '';
  if (file.dataUrl.length > maxLength) return tooLargeMessage;

  const dataUrlMimeType = getDataUrlMimeType(file.dataUrl);
  if (dataUrlMimeType !== getNormalizedFileMimeType(file)) {
    return PRODUCT_REQUEST_VALIDATION_MESSAGES.format.attachmentData;
  }

  const dataUrlSize = getDataUrlByteSize(file.dataUrl);
  if (dataUrlSize === null || dataUrlSize !== file.size) {
    return PRODUCT_REQUEST_VALIDATION_MESSAGES.format.fileSizeMismatch;
  }

  return dataUrlSize > maxSizeBytes ? tooLargeMessage : '';
}

//===================================================================

export function validateProductRequestImageFile(
  file: ProductRequestFileLike
): string {
  const metadataError = validateFileMetadata(file);
  if (metadataError) return metadataError;

  if (
    !isAllowedFile(
      file,
      PRODUCT_REQUEST_IMAGE_RULES.mimeTypes,
      PRODUCT_REQUEST_IMAGE_RULES.extensions
    )
  ) {
    return PRODUCT_REQUEST_VALIDATION_MESSAGES.format.productImage;
  }

  if (file.size > PRODUCT_REQUEST_IMAGE_RULES.maxSizeBytes) {
    return PRODUCT_REQUEST_VALIDATION_MESSAGES.limits.productImageSize;
  }

  return validateDataUrl(
    file,
    PRODUCT_REQUEST_IMAGE_RULES.maxDataUrlLength,
    PRODUCT_REQUEST_IMAGE_RULES.maxSizeBytes,
    PRODUCT_REQUEST_VALIDATION_MESSAGES.limits.productImageData
  );
}

//===================================================================

export function validateProductRequestAdditionalFiles(
  files: readonly ProductRequestFileLike[],
  options: Readonly<{ requireDataUrl?: boolean }> = {}
): string {
  if (files.length > PRODUCT_REQUEST_ATTACHMENT_RULES.maxFiles) {
    return PRODUCT_REQUEST_VALIDATION_MESSAGES.limits.attachmentsCount;
  }

  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  if (totalSize > PRODUCT_REQUEST_ATTACHMENT_RULES.maxTotalSizeBytes) {
    return PRODUCT_REQUEST_VALIDATION_MESSAGES.limits.attachmentsTotalSize;
  }

  for (const file of files) {
    const metadataError = validateFileMetadata(file);
    if (metadataError) return metadataError;

    if (options.requireDataUrl && !file.dataUrl) {
      return PRODUCT_REQUEST_VALIDATION_MESSAGES.limits.attachmentDataRequired(
        file.name
      );
    }

    if (
      !isAllowedFile(
        file,
        PRODUCT_REQUEST_ATTACHMENT_RULES.mimeTypes,
        PRODUCT_REQUEST_ATTACHMENT_RULES.extensions
      )
    ) {
      return PRODUCT_REQUEST_VALIDATION_MESSAGES.format.attachment;
    }

    if (file.size > PRODUCT_REQUEST_ATTACHMENT_RULES.maxSizeBytes) {
      return PRODUCT_REQUEST_VALIDATION_MESSAGES.limits.attachmentSize(
        file.name
      );
    }

    const dataUrlError = validateDataUrl(
      file,
      PRODUCT_REQUEST_ATTACHMENT_RULES.maxDataUrlLength,
      PRODUCT_REQUEST_ATTACHMENT_RULES.maxSizeBytes,
      PRODUCT_REQUEST_VALIDATION_MESSAGES.limits.attachmentData(file.name)
    );

    if (dataUrlError) return dataUrlError;
  }

  return '';
}

//===================================================================

export function toProductRequestFileMetadata(
  file: ProductRequestFileLike,
  dataUrl?: string | null
): ProductRequestFile {
  const resolvedDataUrl = dataUrl ?? file.dataUrl;

  return {
    name: file.name.trim(),
    type: getNormalizedFileMimeType(file),
    size: file.size,
    ...(resolvedDataUrl ? { dataUrl: resolvedDataUrl } : {}),
  };
}
