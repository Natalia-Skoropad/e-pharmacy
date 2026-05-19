export const AUTH_SESSION_READY_TOKEN = 'cookie-auth-session';

const AUTH_READY_COOKIE_NAME = 'e_pharmacy_auth_ready';
const AUTH_READY_COOKIE_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

//===================================================================

function canUseDocumentCookie(): boolean {
  return typeof document !== 'undefined';
}

//===================================================================

function getSecureCookiePart(): string {
  return window.location.protocol === 'https:' ? '; Secure' : '';
}

//===================================================================

export function getAuthToken(): string | null {
  if (!canUseDocumentCookie()) return null;

  const hasAuthReadyCookie = document.cookie
    .split(';')
    .map((cookie) => cookie.trim())
    .some((cookie) => cookie.startsWith(`${AUTH_READY_COOKIE_NAME}=`));

  return hasAuthReadyCookie ? AUTH_SESSION_READY_TOKEN : null;
}

//===================================================================

export function setAuthToken(_token: string): void {
  if (!canUseDocumentCookie()) return;

  document.cookie = `${AUTH_READY_COOKIE_NAME}=1; Path=/; Max-Age=${AUTH_READY_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax${getSecureCookiePart()}`;
}

//===================================================================

export function removeAuthToken(): void {
  if (!canUseDocumentCookie()) return;

  document.cookie = `${AUTH_READY_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax${getSecureCookiePart()}`;
}
