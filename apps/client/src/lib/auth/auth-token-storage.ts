export const AUTH_SESSION_READY_TOKEN = 'cookie-auth-session';

const AUTH_READY_COOKIE_NAME = 'e_pharmacy_auth_ready';
const AUTH_FALLBACK_TOKEN_COOKIE_NAME = 'e_pharmacy_client_auth_token';
const AUTH_COOKIE_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

//===================================================================

function canUseDocumentCookie(): boolean {
  return typeof document !== 'undefined';
}

//===================================================================

function getSecureCookiePart(): string {
  return window.location.protocol === 'https:' ? '; Secure' : '';
}

//===================================================================

function getCookieValue(name: string): string | null {
  if (!canUseDocumentCookie()) return null;

  const cookie = document.cookie
    .split(';')
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${name}=`));

  if (!cookie) return null;

  const value = cookie.slice(name.length + 1);

  return value ? decodeURIComponent(value) : null;
}

//===================================================================

function setClientCookie(name: string, value: string): void {
  if (!canUseDocumentCookie()) return;

  document.cookie = `${name}=${encodeURIComponent(
    value
  )}; Path=/; Max-Age=${AUTH_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax${getSecureCookiePart()}`;
}

//===================================================================

function removeClientCookie(name: string): void {
  if (!canUseDocumentCookie()) return;

  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax${getSecureCookiePart()}`;
}

//===================================================================

export function getAuthToken(): string | null {
  const fallbackToken = getCookieValue(AUTH_FALLBACK_TOKEN_COOKIE_NAME);

  if (fallbackToken) return fallbackToken;

  const hasAuthReadyCookie = Boolean(getCookieValue(AUTH_READY_COOKIE_NAME));

  return hasAuthReadyCookie ? AUTH_SESSION_READY_TOKEN : null;
}

//===================================================================

export function setAuthToken(token: string): void {
  if (!canUseDocumentCookie()) return;

  setClientCookie(AUTH_READY_COOKIE_NAME, '1');
  setClientCookie(AUTH_FALLBACK_TOKEN_COOKIE_NAME, token);
}

//===================================================================

export function removeAuthToken(): void {
  if (!canUseDocumentCookie()) return;

  removeClientCookie(AUTH_READY_COOKIE_NAME);
  removeClientCookie(AUTH_FALLBACK_TOKEN_COOKIE_NAME);
}
