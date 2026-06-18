import {
  AUTH_READY_COOKIE_MAX_AGE_SECONDS,
  AUTH_READY_COOKIE_NAME,
} from '@e-pharmacy/config/auth';

//===================================================================

export type AuthSessionHintCookieOptions = {
  domain?: string;
  maxAgeSeconds?: number;
  sameSite?: 'Lax' | 'Strict' | 'None';
  secure?: boolean;
};

//===================================================================

function canUseBrowserCookies(): boolean {
  return typeof document !== 'undefined' && typeof window !== 'undefined';
}

//===================================================================

function getCookieAttributes(options: AuthSessionHintCookieOptions): string {
  const sameSite = options.sameSite ?? 'Lax';
  const secure =
    options.secure ??
    (window.location.protocol === 'https:' || sameSite === 'None');
  const domain = options.domain ? `; Domain=${options.domain}` : '';
  return `; Path=/; SameSite=${sameSite}${domain}${secure ? '; Secure' : ''}`;
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

export function setBrowserAuthSessionHint(
  options: AuthSessionHintCookieOptions = {}
): void {
  if (!canUseBrowserCookies()) return;
  const maxAge = options.maxAgeSeconds ?? AUTH_READY_COOKIE_MAX_AGE_SECONDS;
  document.cookie = `${AUTH_READY_COOKIE_NAME}=1; Max-Age=${maxAge}${getCookieAttributes(options)}`;
}

//===================================================================

export function clearBrowserAuthSessionHint(
  options: AuthSessionHintCookieOptions = {}
): void {
  if (!canUseBrowserCookies()) return;
  document.cookie = `${AUTH_READY_COOKIE_NAME}=; Max-Age=0${getCookieAttributes(options)}`;
}
