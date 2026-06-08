export const PICTURE_ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

//===================================================================

export type PictureAllowedType = (typeof PICTURE_ALLOWED_TYPES)[number];

//===================================================================

export const PICTURE_ACCEPT = PICTURE_ALLOWED_TYPES.join(',');

//===================================================================

export function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);

    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}
