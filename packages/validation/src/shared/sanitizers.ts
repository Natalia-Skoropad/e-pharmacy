import {
  USER_NAME_MAX_LENGTH,
  USER_EMAIL_MAX_LENGTH,
  USER_PHONE_MAX_LENGTH,
  USER_ADDRESS_MAX_LENGTH,
  USER_PASSWORD_MAX_LENGTH,
  USER_SEARCH_MAX_LENGTH,
  USER_ORDER_COMMENT_MAX_LENGTH,
} from './limits';

//=============================================================================

export function sanitizeName(value: string): string {
  return value
    .replace(/[^A-Za-z '-]/g, '')
    .replace(/\s{2,}/g, ' ')
    .slice(0, USER_NAME_MAX_LENGTH);
}

//=============================================================================

export function sanitizeEmail(value: string): string {
  return value.trimStart().replace(/\s/g, '').slice(0, USER_EMAIL_MAX_LENGTH);
}

//=============================================================================

export function sanitizePhone(value: string): string {
  const hasPlus = value.trim().startsWith('+');
  const digits = value.replace(/\D/g, '').slice(0, 12);

  if (hasPlus || digits.startsWith('380')) {
    return `+${digits}`.slice(0, USER_PHONE_MAX_LENGTH);
  }

  return digits.slice(0, USER_PHONE_MAX_LENGTH);
}

//=============================================================================

export function sanitizeAddress(value: string): string {
  return value
    .replace(/[^A-Za-z0-9\s.,'’/#-]/g, '')
    .slice(0, USER_ADDRESS_MAX_LENGTH);
}

//=============================================================================

export function sanitizePassword(value: string): string {
  return value.replace(/\s/g, '').slice(0, USER_PASSWORD_MAX_LENGTH);
}

//=============================================================================

export function sanitizeSearchText(value: string): string {
  return value
    .trim()
    .replace(/\s{2,}/g, ' ')
    .slice(0, USER_SEARCH_MAX_LENGTH);
}


//=============================================================================

export function sanitizeOrderComment(value: string): string {
  return value
    .replace(/[^A-Za-z0-9\s.,!?;:'"()\-]/g, '')
    .slice(0, USER_ORDER_COMMENT_MAX_LENGTH);
}
