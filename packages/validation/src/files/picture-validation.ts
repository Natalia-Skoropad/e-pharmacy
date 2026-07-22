import { VALIDATION_MESSAGES } from '../shared/messages';
import { PICTURE_DATA_URL_PATTERN } from '../shared/patterns';

//===================================================================

export const PICTURE_FILE_MAX_BYTES = 450 * 1024;
export const PICTURE_DATA_URL_MAX_LENGTH = 700_000;
export const PICTURE_HTTP_URL_MAX_LENGTH = 2_048;

//===================================================================

export const PICTURE_ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export const PICTURE_ALLOWED_DATA_URL_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

//===================================================================

export type PictureMimeType = (typeof PICTURE_ALLOWED_MIME_TYPES)[number];

//===================================================================

export const PICTURE_ACCEPT = PICTURE_ALLOWED_MIME_TYPES.join(',');

//===================================================================

export function isPictureMimeType(value: string): value is PictureMimeType {
  return PICTURE_ALLOWED_MIME_TYPES.some((mimeType) => mimeType === value);
}

//===================================================================

export function isPictureDataUrl(value: string): boolean {
  return PICTURE_DATA_URL_PATTERN.test(value);
}

//===================================================================

export function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

//===================================================================

export function buildPictureFileError(file: File): string {
  if (!isPictureMimeType(file.type)) {
    return VALIDATION_MESSAGES.format.pictureFileType;
  }
  if (file.size > PICTURE_FILE_MAX_BYTES) {
    return VALIDATION_MESSAGES.limits.pictureFileSize;
  }

  return '';
}

//===================================================================

export function buildPictureUrlError(
  value: string,
  options: Readonly<{ required?: boolean }> = {}
): string {
  const pictureUrl = value.trim();

  if (!pictureUrl) {
    return options.required ? VALIDATION_MESSAGES.required.picture : '';
  }
  if (isPictureDataUrl(pictureUrl)) {
    return pictureUrl.length > PICTURE_DATA_URL_MAX_LENGTH
      ? VALIDATION_MESSAGES.limits.pictureDataUrlMax
      : '';
  }
  if (isHttpUrl(pictureUrl)) {
    return pictureUrl.length > PICTURE_HTTP_URL_MAX_LENGTH
      ? VALIDATION_MESSAGES.limits.pictureHttpUrlMax
      : '';
  }

  return VALIDATION_MESSAGES.format.picture;
}
