import { AUTH_READY_COOKIE_NAME } from '@e-pharmacy/config/auth';

//===================================================================

function canUseBrowserCookies(): boolean {
  return typeof document !== 'undefined';
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
