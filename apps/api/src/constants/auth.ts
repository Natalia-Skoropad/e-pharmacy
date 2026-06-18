export const AUTH_APPLICATIONS = {
  CLIENT: 'client',
  PHARMACY: 'pharmacy',
  ADMIN: 'admin',
} as const;

//===============================================================

export const USER_ROLES = {
  CLIENT: 'client',
  PHARMACY: 'pharmacy',
  ADMIN: 'admin',
} as const;

//===============================================================

export const USER_STATUSES = {
  ACTIVE: 'active',
  BLOCKED: 'blocked',
} as const;

//===============================================================

export const PHARMACY_STATUSES = {
  NEW: 'new',
  ON_VERIFICATION: 'on_verification',
  ON_MODERATION: 'on_moderation',
  ACTIVE: 'active',
  BLOCKED: 'blocked',
} as const;

//===============================================================

export const PASSWORD_SALT_ROUNDS = 10;

//===============================================================

export const ACCESS_TOKEN_COOKIE_NAME = 'e_pharmacy_access_token';
export const REFRESH_TOKEN_COOKIE_NAME = 'e_pharmacy_refresh_token';

// Legacy access-token cookie name from the previous single-JWT implementation.
// Keep it only for reading/clearing old browser cookies during migration.
export const AUTH_COOKIE_NAME = 'e_pharmacy_auth_token';
