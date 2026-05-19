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

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 20;

export const USER_NAME_MIN_LENGTH = 2;
export const USER_NAME_MAX_LENGTH = 20;

export const EMAIL_MAX_LENGTH = 64;
export const PHONE_MAX_LENGTH = 20;

//===============================================================

export const PASSWORD_SALT_ROUNDS = 10;

//===============================================================

export const AUTH_COOKIE_NAME = 'e_pharmacy_auth_token';
