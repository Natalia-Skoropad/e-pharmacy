import { AVATAR_DATA_URL_PATTERN } from './patterns';

//=============================================================================

export const AVATAR_ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export type AvatarAllowedType = (typeof AVATAR_ALLOWED_TYPES)[number];

export const AVATAR_ACCEPT = AVATAR_ALLOWED_TYPES.join(',');

//=============================================================================

export function isAvatarAllowedType(value: string): value is AvatarAllowedType {
  return AVATAR_ALLOWED_TYPES.includes(value as AvatarAllowedType);
}

//=============================================================================

export function isAvatarDataUrl(value: string): boolean {
  return AVATAR_DATA_URL_PATTERN.test(value.trim());
}

//=============================================================================

export function isHttpUrl(value: string): boolean {
  try {
    const parsedUrl = new URL(value);

    return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
  } catch {
    return false;
  }
}
