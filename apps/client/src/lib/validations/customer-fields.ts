import {
  ADDRESS_PATTERN,
  NAME_PATTERN,
  PHONE_PATTERN,
  VALIDATION_LIMITS,
  buildAddressError,
  buildNameError,
  buildPhoneError,
  sanitizeAddress,
  sanitizeName,
  sanitizePhone,
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

export const sanitizeCustomerName = sanitizeName;
export const sanitizeCustomerPhone = sanitizePhone;
export const sanitizeCustomerAddress = sanitizeAddress;

//===================================================================

export function getCustomerNameError(value: string): string {
  return buildNameError(value, { trailingDot: true });
}

export function getCustomerPhoneError(value: string): string {
  return buildPhoneError(value, { trailingDot: true });
}

export function getCustomerAddressError(value: string): string {
  return buildAddressError(value, { trailingDot: true });
}
