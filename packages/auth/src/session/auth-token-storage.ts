import {
  AUTH_COOKIE_MAX_AGE_SECONDS,
  AUTH_READY_COOKIE_NAME,
} from './auth-session';

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

export function getClientAuthSessionHint(): boolean {
  return Boolean(getCookieValue(AUTH_READY_COOKIE_NAME));
}

//===================================================================

export function setClientAuthSessionHint(): void {
  if (!canUseDocumentCookie()) return;

  setClientCookie(AUTH_READY_COOKIE_NAME, '1');
}

//===================================================================

export function removeClientAuthSessionHint(): void {
  if (!canUseDocumentCookie()) return;

  removeClientCookie(AUTH_READY_COOKIE_NAME);
}
