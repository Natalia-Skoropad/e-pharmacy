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

export const VENDOR_ACCOUNT_STATUSES = {
  PENDING: 'pending',
  ACTIVE: 'active',
  REJECTED: 'rejected',
  BLOCKED: 'blocked',
} as const;

//===============================================================

export const SHOP_STATUSES = {
  DRAFT: 'draft',
  PENDING_REVIEW: 'pending_review',
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
} as const;

//===============================================================

export const PASSWORD_SALT_ROUNDS = 10;

//===============================================================

export const ACCESS_TOKEN_COOKIE_NAME = 'e_pharmacy_access_token';
export const REFRESH_TOKEN_COOKIE_NAME = 'e_pharmacy_refresh_token';

// Legacy access-token cookie name from the previous single-JWT implementation.
// Keep it only for reading/clearing old browser cookies during migration.
export const AUTH_COOKIE_NAME = 'e_pharmacy_auth_token';
