export const AUTH_SESSION_MARKER = 'cookie-auth-session';

// Client-readable marker only. It helps the UI and Next proxy know that a
// cookie auth flow was started, but it is not a security token and must not be
// used as a backend authorization source.
export const AUTH_READY_COOKIE_NAME = 'e_pharmacy_auth_ready';
export const AUTH_COOKIE_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;
