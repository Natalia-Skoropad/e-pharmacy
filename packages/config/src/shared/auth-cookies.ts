/**
 * Shared auth cookie contract.
 *
 * Keep these names in sync with the backend auth cookie constants. The Next BFF,
 * frontend auth session hint, and API auth cookie writer all depend on this
 * exact contract.
 */
export const AUTH_COOKIES = {
  ACCESS_TOKEN: 'e_pharmacy_access_token',
  REFRESH_TOKEN: 'e_pharmacy_refresh_token',
  LEGACY_AUTH_TOKEN: 'e_pharmacy_auth_token',
  AUTH_READY: 'e_pharmacy_auth_ready',
} as const;

// Client-readable auth hint only. It helps the provider decide whether
// it is worth trying to refresh the current user during bootstrap.
export const AUTH_READY_COOKIE_NAME = AUTH_COOKIES.AUTH_READY;

// HttpOnly cookies issued by the backend through the Next API proxy.
export const ACCESS_TOKEN_COOKIE_NAME = AUTH_COOKIES.ACCESS_TOKEN;
export const REFRESH_TOKEN_COOKIE_NAME = AUTH_COOKIES.REFRESH_TOKEN;
export const LEGACY_AUTH_COOKIE_NAME = AUTH_COOKIES.LEGACY_AUTH_TOKEN;

export const AUTH_COOKIE_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;
