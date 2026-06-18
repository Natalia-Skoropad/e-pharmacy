import {
  AUTH_READY_COOKIE_MAX_AGE_SECONDS,
  AUTH_READY_COOKIE_NAME,
} from '@e-pharmacy/config/auth';

//===================================================================

function canUseBrowserCookies(): boolean {
  return typeof document !== 'undefined' && typeof window !== 'undefined';
}

//===================================================================

function getSecureCookiePart(): string {
  return window.location.protocol === 'https:' ? '; Secure' : '';
}

//===================================================================

function getCookieValue(name: string): string | null {
  if (!canUseBrowserCookies()) return null;

  const cookie = document.cookie
    .split(';')
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${name}=`));

  if (!cookie) return null;

  const value = cookie.slice(name.length + 1);
  return value ? decodeURIComponent(value) : null;
}

//===================================================================

export function hasBrowserAuthSessionHint(): boolean {
  return Boolean(getCookieValue(AUTH_READY_COOKIE_NAME));
}

//===================================================================

export function setBrowserAuthSessionHint(): void {
  if (!canUseBrowserCookies()) return;

  document.cookie = `${AUTH_READY_COOKIE_NAME}=1; Path=/; Max-Age=${AUTH_READY_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax${getSecureCookiePart()}`;
}

//===================================================================

export function clearBrowserAuthSessionHint(): void {
  if (!canUseBrowserCookies()) return;

  document.cookie = `${AUTH_READY_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax${getSecureCookiePart()}`;
}
