import { type NextRequest, type NextResponse } from 'next/server';

import {
  ACCESS_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_NAME,
} from '@/lib/auth/auth-session';

//===================================================================

const AUTH_COOKIE_NAMES = new Set([
  ACCESS_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_NAME,
]);

//===================================================================

type ParsedSetCookie = {
  name: string;
  value: string;
  maxAge?: number;
  expires?: Date;
};

//===================================================================

function splitSetCookieHeader(value: string): string[] {
  return value
    .split(/,(?=\s*[^;,\s]+=)/)
    .map((item) => item.trim())
    .filter(Boolean);
}

//===================================================================

export function getSetCookieHeaders(headers: Headers): string[] {
  const headersWithSetCookie = headers as Headers & {
    getSetCookie?: () => string[];
  };

  const setCookieHeaders = headersWithSetCookie.getSetCookie?.();
  if (setCookieHeaders?.length) return setCookieHeaders;

  const setCookie = headers.get('set-cookie');

  return setCookie ? splitSetCookieHeader(setCookie) : [];
}

//===================================================================

function parseSetCookie(setCookie: string): ParsedSetCookie | null {
  const parts = setCookie
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean);

  const [cookiePair, ...attributes] = parts;
  if (!cookiePair) return null;

  const [name, ...valueParts] = cookiePair.split('=');
  const value = valueParts.join('=');

  if (!name || !AUTH_COOKIE_NAMES.has(name)) return null;

  const parsed: ParsedSetCookie = {
    name,
    value,
  };

  attributes.forEach((attribute) => {
    const [rawKey, ...rawValueParts] = attribute.split('=');
    const key = rawKey?.toLowerCase();
    const attributeValue = rawValueParts.join('=');

    if (key === 'max-age') {
      const maxAge = Number(attributeValue);
      if (Number.isFinite(maxAge)) parsed.maxAge = maxAge;
    }

    if (key === 'expires') {
      const expires = new Date(attributeValue);
      if (!Number.isNaN(expires.getTime())) parsed.expires = expires;
    }
  });

  return parsed;
}

//===================================================================

function isSecureRequest(request: NextRequest): boolean {
  return request.nextUrl.protocol === 'https:';
}

//===================================================================

export function applyBackendAuthCookies(
  source: Response,
  target: NextResponse,
  request: NextRequest
): void {
  getSetCookieHeaders(source.headers)
    .map(parseSetCookie)
    .filter((cookie): cookie is ParsedSetCookie => Boolean(cookie))
    .forEach((cookie) => {
      target.cookies.set(cookie.name, cookie.value, {
        httpOnly: true,
        secure: isSecureRequest(request),
        sameSite: 'lax',
        path: '/',
        ...(cookie.maxAge !== undefined ? { maxAge: cookie.maxAge } : {}),
        ...(cookie.expires ? { expires: cookie.expires } : {}),
      });
    });
}

//===================================================================

export function getCookiePairFromSetCookie(setCookie: string): string | null {
  return setCookie.split(';')[0]?.trim() || null;
}
