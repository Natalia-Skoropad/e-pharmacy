export const CUSTOMER_NAME_MIN_LENGTH = 2;
export const CUSTOMER_NAME_MAX_LENGTH = 20;
export const CUSTOMER_PHONE_MIN_LENGTH = 13;
export const CUSTOMER_PHONE_MAX_LENGTH = 13;
export const CUSTOMER_ADDRESS_MIN_LENGTH = 10;
export const CUSTOMER_ADDRESS_MAX_LENGTH = 200;

//===================================================================

export const CUSTOMER_NAME_REGEX = /^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/;
export const CUSTOMER_PHONE_REGEX = /^\+380\d{9}$/;
export const CUSTOMER_ADDRESS_REGEX = /^[A-Za-z0-9\s.,'’/#-]+$/;

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
