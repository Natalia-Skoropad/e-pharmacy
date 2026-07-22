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

export const PICTURE_ACCEPT = PICTURE_ALLOWED_MIME_TYPES.join(',');

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
