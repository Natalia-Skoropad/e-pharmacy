/**
 * Shared frontend auth cookie contract.
 *
 * Keep the token cookie names logically aligned with the backend-local auth
 * constants. The backend must not import this frontend package.
 */
export const ACCESS_TOKEN_COOKIE_NAME = 'e_pharmacy_access_token';
export const REFRESH_TOKEN_COOKIE_NAME = 'e_pharmacy_refresh_token';
export const LEGACY_AUTH_COOKIE_NAME = 'e_pharmacy_auth_token';

// Client-readable auth hint used only for auth bootstrap and redirects.
export const AUTH_READY_COOKIE_NAME = 'e_pharmacy_auth_ready';

//===================================================================

export const REFRESH_TOKEN_COOKIE_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;
export const AUTH_READY_COOKIE_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;
