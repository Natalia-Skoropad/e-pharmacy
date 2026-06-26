import {
  USER_ADDRESS_MAX_LENGTH,
  USER_EMAIL_MAX_LENGTH,
  USER_NAME_MAX_LENGTH,
  USER_ORDER_COMMENT_MAX_LENGTH,
  USER_PASSWORD_MAX_LENGTH,
  USER_PHONE_MAX_LENGTH,
  USER_REVIEW_COMMENT_MAX_LENGTH,
  USER_SEARCH_MAX_LENGTH,
  WORKING_HOURS_MAX_LENGTH,
  TEXT_EDITOR_MAX_LENGTH,
  TAX_ID_MAX_LENGTH,
  IBAN_MAX_LENGTH,
  PAYMENT_PURPOSE_MAX_LENGTH,
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

//=============================================================================

export function sanitizeReviewComment(value: string): string {
  return value
    .replace(/[^A-Za-z0-9\s.,!?;:'"()\-]/g, '')
    .slice(0, USER_REVIEW_COMMENT_MAX_LENGTH);
}


//=============================================================================

export function sanitizeWorkingHours(value: string): string {
  return value
    .replace(/[^A-Za-z0-9\s.,:;–—'’/#()-]/g, '')
    .slice(0, WORKING_HOURS_MAX_LENGTH);
}

//=============================================================================

export function sanitizeTextEditor(value: string): string {
  return value
    .replace(/[^A-Za-z0-9\s.,!?;:'"()\-–—/#%+*\n\r]/g, '')
    .slice(0, TEXT_EDITOR_MAX_LENGTH);
}

//=============================================================================

export function sanitizeTaxId(value: string): string {
  return value.replace(/\D/g, '').slice(0, TAX_ID_MAX_LENGTH);
}

//=============================================================================

export function sanitizeIban(value: string): string {
  return value.replace(/\s/g, '').toUpperCase().slice(0, IBAN_MAX_LENGTH);
}

//=============================================================================

export function sanitizePaymentPurpose(value: string): string {
  return value
    .replace(/[^A-Za-z0-9\s.,!?;:'"()\-]/g, '')
    .slice(0, PAYMENT_PURPOSE_MAX_LENGTH);
}
