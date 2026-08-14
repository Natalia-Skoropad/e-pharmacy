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

//===============================================================

export const AUTH_ERROR_CODES = {
  INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  SESSION_INVALID: 'AUTH_SESSION_INVALID',
  SESSION_REVOKED: 'AUTH_SESSION_REVOKED',
  USER_BLOCKED: 'AUTH_USER_BLOCKED',
  FORBIDDEN_ORIGIN: 'AUTH_FORBIDDEN_ORIGIN',
  CSRF_FAILED: 'AUTH_CSRF_FAILED',
  EMAIL_CONFLICT: 'AUTH_EMAIL_CONFLICT',
  PHONE_CONFLICT: 'AUTH_PHONE_CONFLICT',
  RESET_TOKEN_INVALID: 'AUTH_RESET_TOKEN_INVALID',
  RATE_LIMITED: 'AUTH_RATE_LIMITED',
  VALIDATION_FAILED: 'AUTH_VALIDATION_FAILED',
  RESOURCE_NOT_FOUND: 'AUTH_RESOURCE_NOT_FOUND',
  INVALID_RESPONSE: 'AUTH_INVALID_RESPONSE',
  REGISTRATION_SESSION_FAILED: 'AUTH_REGISTRATION_SESSION_FAILED',
  SERVICE_UNAVAILABLE: 'AUTH_SERVICE_UNAVAILABLE',
} as const;
