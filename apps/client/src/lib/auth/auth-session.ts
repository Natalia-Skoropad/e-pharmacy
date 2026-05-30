export const AUTH_SESSION_MARKER = 'cookie-auth-session';

// Client-readable marker only. It helps React avoid a visible auth flicker after
// login/register/refresh, but it is not a security token and must not be used as
// a source of truth for route protection.
export const AUTH_READY_COOKIE_NAME = 'e_pharmacy_auth_ready';

// HttpOnly cookies issued by the backend through the Next API proxy.
export const ACCESS_TOKEN_COOKIE_NAME = 'e_pharmacy_access_token';
export const REFRESH_TOKEN_COOKIE_NAME = 'e_pharmacy_refresh_token';

export const AUTH_COOKIE_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;
