import { USER_SEARCH_MAX_LENGTH, TAX_ID_MAX_LENGTH } from './limits';

import { PHONE_PATTERN } from './patterns';

//=============================================================================

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

//=============================================================================

export function normalizePhoneInput(value: string): string {
  const compactValue = value.trim().replace(/[\s()\-]/g, '');

  const normalizedValue =
    compactValue.startsWith('380') && !compactValue.startsWith('+')
      ? `+${compactValue}`
      : compactValue;

  return normalizedValue;
}

//=============================================================================

export function validateNormalizedPhone(value: string): boolean {
  return PHONE_PATTERN.test(value.trim());
}

//=============================================================================

export function sanitizeSearchText(value: string): string {
  return value
    .trim()
    .replace(/\s{2,}/g, ' ')
    .slice(0, USER_SEARCH_MAX_LENGTH);
}

//=============================================================================

export function sanitizeTaxId(value: string): string {
  return value.replace(/\D/g, '').slice(0, TAX_ID_MAX_LENGTH);
}

//=============================================================================

export function normalizeIban(value: string): string {
  return value.replace(/\s/g, '').toUpperCase();
}
