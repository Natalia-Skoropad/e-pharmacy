import { VALIDATION_LIMITS } from '@e-pharmacy/validation';

export const USER_ROLES = {
  CUSTOMER: 'customer',
  VENDOR: 'vendor',
  ADMIN: 'admin',
} as const;

//===============================================================

export const USER_STATUSES = {
  ACTIVE: 'active',
  BLOCKED: 'blocked',
} as const;

//===============================================================

//===============================================================

export const PASSWORD_MIN_LENGTH = VALIDATION_LIMITS.passwordMin;
export const PASSWORD_MAX_LENGTH = VALIDATION_LIMITS.passwordMax;

export const USER_NAME_MIN_LENGTH = VALIDATION_LIMITS.nameMin;
export const USER_NAME_MAX_LENGTH = VALIDATION_LIMITS.nameMax;

export const EMAIL_MAX_LENGTH = VALIDATION_LIMITS.emailMax;
export const PHONE_MIN_LENGTH = VALIDATION_LIMITS.phoneMin;
export const PHONE_MAX_LENGTH = VALIDATION_LIMITS.phoneMax;
export const ADDRESS_MIN_LENGTH = VALIDATION_LIMITS.addressMin;
export const ADDRESS_MAX_LENGTH = VALIDATION_LIMITS.addressMax;
export const AVATAR_URL_MAX_LENGTH = VALIDATION_LIMITS.avatarUrlMax;

//===============================================================

export const PASSWORD_SALT_ROUNDS = 10;

//===============================================================

export const AUTH_COOKIE_NAME = 'e_pharmacy_auth_token';
