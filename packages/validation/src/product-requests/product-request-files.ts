import type { ProductRequestFile } from '@e-pharmacy/types/product-requests';

import {
  PRODUCT_REQUEST_ADDITIONAL_FILE_EXTENSIONS,
  PRODUCT_REQUEST_ADDITIONAL_FILE_MIME_TYPES,
  PRODUCT_REQUEST_LIMITS,
  PRODUCT_REQUEST_IMAGE_EXTENSIONS,
  PRODUCT_REQUEST_IMAGE_MIME_TYPES,
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

function isAllowedFile(
  file: ProductRequestFileLike,
  mimeTypes: readonly string[],
  extensions: readonly string[]
): boolean {
  const normalizedType = file.type.trim().toLowerCase();
  const extension = getFileExtension(file.name);

  if (!extensions.includes(extension)) return false;

  return (
    !normalizedType ||
    normalizedType === 'application/octet-stream' ||
    mimeTypes.includes(normalizedType)
  );
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

function validateFileMetadata(file: ProductRequestFileLike): string {
  const fileName = file.name.trim();
  const fileType = file.type.trim();

  if (!fileName) return 'File name is required.';
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

export function validateProductRequestImageFile(
  file: ProductRequestFileLike
): string {
  const metadataError = validateFileMetadata(file);
  if (metadataError) return metadataError;

  if (
    !isAllowedFile(
      file,
      PRODUCT_REQUEST_IMAGE_MIME_TYPES,
      PRODUCT_REQUEST_IMAGE_EXTENSIONS
    )
  ) {
    return PRODUCT_REQUEST_VALIDATION_MESSAGES.format.productImage;
  }

  if (file.size > PRODUCT_REQUEST_LIMITS.productImageMaxSizeBytes) {
    return PRODUCT_REQUEST_VALIDATION_MESSAGES.limits.productImageSize;
  }

  return '';
}

//===================================================================

export function validateProductRequestAdditionalFiles(
  files: readonly ProductRequestFileLike[]
): string {
  if (files.length > PRODUCT_REQUEST_LIMITS.additionalFilesMax) {
    return PRODUCT_REQUEST_VALIDATION_MESSAGES.limits.additionalFilesCount;
  }

  for (const file of files) {
    const metadataError = validateFileMetadata(file);
    if (metadataError) return metadataError;

    if (
      !isAllowedFile(
        file,
        PRODUCT_REQUEST_ADDITIONAL_FILE_MIME_TYPES,
        PRODUCT_REQUEST_ADDITIONAL_FILE_EXTENSIONS
      )
    ) {
      return PRODUCT_REQUEST_VALIDATION_MESSAGES.format.additionalFile;
    }

    if (file.size > PRODUCT_REQUEST_LIMITS.additionalFileMaxSizeBytes) {
      return PRODUCT_REQUEST_VALIDATION_MESSAGES.limits.additionalFileSize(
        file.name
      );
    }
  }

  return '';
}

//===================================================================

export function toProductRequestFileMetadata(
  file: ProductRequestFileLike,
  dataUrl?: string | null
): ProductRequestFile {
  return {
    name: file.name.trim(),
    type: getNormalizedFileMimeType(file),
    size: file.size,
    ...(dataUrl ? { dataUrl } : {}),
  };
}
