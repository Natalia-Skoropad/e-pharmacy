import {
  ACCESS_TOKEN_COOKIE_NAME,
  LEGACY_AUTH_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_NAME,
} from '@e-pharmacy/config/auth';

//===================================================================

export type AuthCookieForwardMode = 'access-only' | 'refresh-only' | 'none';

//===================================================================

const ACCESS_COOKIE_NAMES = new Set([
  ACCESS_TOKEN_COOKIE_NAME,
  LEGACY_AUTH_COOKIE_NAME,
]);

//===================================================================

export function parseCookieHeader(cookieHeader: string): Map<string, string> {
  const cookies = new Map<string, string>();

  cookieHeader
    .split(';')
    .map((cookie) => cookie.trim())
    .filter(Boolean)
    .forEach((cookie) => {
      const separatorIndex = cookie.indexOf('=');
      if (separatorIndex <= 0) return;

      const name = cookie.slice(0, separatorIndex).trim();
      const value = cookie.slice(separatorIndex + 1);
      if (!name || !value || /[\r\n]/.test(name) || /[\r\n]/.test(value))
        return;

      // Last duplicate wins so freshly written auth cookies are not shadowed.
      cookies.delete(name);
      cookies.set(name, value);
    });

  return cookies;
}

//===================================================================

export function createAllowedAuthCookieHeader(
  cookieHeader: string | null,
  mode: AuthCookieForwardMode
): string | undefined {
  if (!cookieHeader || mode === 'none') return undefined;

  const source = parseCookieHeader(cookieHeader);
  const allowed = new Map<string, string>();

  if (mode === 'refresh-only') {
    const refreshToken = source.get(REFRESH_TOKEN_COOKIE_NAME);
    if (refreshToken) allowed.set(REFRESH_TOKEN_COOKIE_NAME, refreshToken);
  } else {
    ACCESS_COOKIE_NAMES.forEach((name) => {
      const value = source.get(name);
      if (value) allowed.set(name, value);
    });
  }

  const serialized = Array.from(allowed.entries())
    .map(([name, value]) => `${name}=${value}`)
    .join('; ');

  return serialized || undefined;
}

//===================================================================

export function createPrivateCookieHeaderWithAccessToken(
  cookieHeader: string | null,
  accessToken: string
): string {
  const source = parseCookieHeader(cookieHeader ?? '');
  const cookies = new Map<string, string>();

  cookies.set(ACCESS_TOKEN_COOKIE_NAME, accessToken);

  const legacyToken = source.get(LEGACY_AUTH_COOKIE_NAME);
  if (legacyToken) cookies.set(LEGACY_AUTH_COOKIE_NAME, legacyToken);

  return Array.from(cookies.entries())
    .map(([name, value]) => `${name}=${value}`)
    .join('; ');
}
