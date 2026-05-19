import {
  ADDRESS_PATTERN,
  NAME_PATTERN,
  PHONE_PATTERN,
  VALIDATION_LIMITS,
} from '@e-pharmacy/validation';

export const CUSTOMER_NAME_MIN_LENGTH = VALIDATION_LIMITS.nameMin;
export const CUSTOMER_NAME_MAX_LENGTH = VALIDATION_LIMITS.nameMax;
export const CUSTOMER_PHONE_MIN_LENGTH = VALIDATION_LIMITS.phoneMin;
export const CUSTOMER_PHONE_MAX_LENGTH = VALIDATION_LIMITS.phoneMax;
export const CUSTOMER_ADDRESS_MIN_LENGTH = VALIDATION_LIMITS.addressMin;
export const CUSTOMER_ADDRESS_MAX_LENGTH = VALIDATION_LIMITS.addressMax;

//===================================================================

export const CUSTOMER_NAME_REGEX = NAME_PATTERN;
export const CUSTOMER_PHONE_REGEX = PHONE_PATTERN;
export const CUSTOMER_ADDRESS_REGEX = ADDRESS_PATTERN;

//===================================================================

export function sanitizeCustomerName(value: string): string {
  return value
    .replace(/[^A-Za-z '-]/g, '')
    .replace(/\s{2,}/g, ' ')
    .slice(0, CUSTOMER_NAME_MAX_LENGTH);
}

export function sanitizeCustomerPhone(value: string): string {
  const hasPlus = value.trim().startsWith('+');
  const digits = value.replace(/\D/g, '').slice(0, 12);

  if (hasPlus || digits.startsWith('380')) {
    return `+${digits}`.slice(0, CUSTOMER_PHONE_MAX_LENGTH);
  }

  return digits.slice(0, CUSTOMER_PHONE_MAX_LENGTH);
}

export function sanitizeCustomerAddress(value: string): string {
  return value
    .replace(/[^A-Za-z0-9\s.,'’/#-]/g, '')
    .slice(0, CUSTOMER_ADDRESS_MAX_LENGTH);
}

//===================================================================

export function getCustomerNameError(value: string): string {
  const name = value.trim();

  if (!name) return '';

  if (name.length < CUSTOMER_NAME_MIN_LENGTH) {
    return `Name must be at least ${CUSTOMER_NAME_MIN_LENGTH} characters.`;
  }

  if (name.length > CUSTOMER_NAME_MAX_LENGTH) {
    return `Name must be at most ${CUSTOMER_NAME_MAX_LENGTH} characters.`;
  }

  if (!CUSTOMER_NAME_REGEX.test(name)) {
    return 'Use only Latin letters, spaces, apostrophe or hyphen.';
  }

  return '';
}

export function getCustomerPhoneError(value: string): string {
  const phone = value.trim();

  if (!phone) return '';

  if (!CUSTOMER_PHONE_REGEX.test(phone)) {
    return 'Enter phone in format +380XXXXXXXXX.';
  }

  return '';
}

export function getCustomerAddressError(value: string): string {
  const address = value.trim();

  if (!address) return '';

  if (address.length < CUSTOMER_ADDRESS_MIN_LENGTH) {
    return `Address must be at least ${CUSTOMER_ADDRESS_MIN_LENGTH} characters.`;
  }

  if (address.length > CUSTOMER_ADDRESS_MAX_LENGTH) {
    return `Address must be at most ${CUSTOMER_ADDRESS_MAX_LENGTH} characters.`;
  }

  if (!CUSTOMER_ADDRESS_REGEX.test(address)) {
    return 'Use Latin letters, numbers, spaces, comma, dot, slash, apostrophe, # or hyphen.';
  }

  return '';
}
