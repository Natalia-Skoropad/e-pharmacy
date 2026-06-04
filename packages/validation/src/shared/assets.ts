import { AVATAR_DATA_URL_PATTERN } from './patterns';

//=============================================================================

export function isDataUrl(value: string): boolean {
  return value.trim().toLowerCase().startsWith('data:');
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
