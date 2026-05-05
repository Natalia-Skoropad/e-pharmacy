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
export const PASSWORD_MAX_LENGTH = 64;
export const USER_NAME_MAX_LENGTH = 64;
