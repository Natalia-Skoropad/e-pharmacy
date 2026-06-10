// Client-readable auth hint only. It helps the provider decide whether
// it is worth trying to refresh the current user during bootstrap.
export const AUTH_READY_COOKIE_NAME = 'e_pharmacy_auth_ready';

// HttpOnly cookies issued by the backend through the Next API proxy.
export const ACCESS_TOKEN_COOKIE_NAME = 'e_pharmacy_access_token';
export const REFRESH_TOKEN_COOKIE_NAME = 'e_pharmacy_refresh_token';
export const LEGACY_AUTH_COOKIE_NAME = 'e_pharmacy_auth_token';

export const AUTH_COOKIE_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;
