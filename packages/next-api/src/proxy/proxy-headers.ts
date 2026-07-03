import 'server-only';
import { type NextRequest } from 'next/server';

import type { HttpMethod } from '@e-pharmacy/api-client/core';

import {
  ACCESS_TOKEN_COOKIE_NAME,
  LEGACY_AUTH_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_NAME,
} from '@e-pharmacy/config/auth';

//===================================================================

type AuthCookieForwardMode = 'all' | 'refresh-only' | 'none';

//===================================================================

type ProxyHeadersOptions = {
  forwardAccept?: boolean;
  forwardContentType?: boolean;
  forwardCookie?: boolean;
  authCookieMode?: AuthCookieForwardMode;
};

//===================================================================

const BFF_PROXY_SECRET_HEADER = 'X-E-Pharmacy-BFF-Secret';

//===================================================================

const AUTH_COOKIE_NAMES = new Set<string>([
  ACCESS_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_NAME,
  LEGACY_AUTH_COOKIE_NAME,
]);

//===================================================================

function shouldForwardCookie(
  name: string,
  authCookieMode: AuthCookieForwardMode
): boolean {
  if (!AUTH_COOKIE_NAMES.has(name)) return true;
  if (authCookieMode === 'none') return false;
  if (authCookieMode === 'refresh-only') {
    return name === REFRESH_TOKEN_COOKIE_NAME;
  }

  return true;
}

//===================================================================

function normalizeCookieHeader(
  cookieHeader: string,
  authCookieMode: AuthCookieForwardMode
): string {
  const cookies = new Map<string, string>();

  cookieHeader
    .split(';')
    .map((cookie) => cookie.trim())
    .filter(Boolean)
    .forEach((cookie) => {
      const [name, ...valueParts] = cookie.split('=');
      const value = valueParts.join('=');

      if (!name || !value) return;
      if (!shouldForwardCookie(name, authCookieMode)) return;

      if (AUTH_COOKIE_NAMES.has(name)) {
        // Keep the last auth cookie value if the browser sends duplicates.
        // This prevents stale cookies from shadowing fresh login/refresh
        // cookies when the request is proxied to the backend.
        cookies.delete(name);
      }

      cookies.set(name, value);
    });

  return Array.from(cookies.entries())
    .map(([name, value]) => `${name}=${value}`)
    .join('; ');
}

//===================================================================

export function createProxyHeaders(
  request: NextRequest,
  {
    forwardAccept = false,
    forwardContentType = true,
    forwardCookie = true,
    authCookieMode = 'all',
  }: ProxyHeadersOptions = {}
): Headers {
  const headers = new Headers();
  const accept = request.headers.get('accept');
  const contentType = request.headers.get('content-type');
  const cookie = request.headers.get('cookie');
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');

  if (forwardAccept && accept) headers.set('Accept', accept);
  if (forwardContentType && contentType)
    headers.set('Content-Type', contentType);
  if (forwardCookie && cookie) {
    const nextCookieHeader = normalizeCookieHeader(cookie, authCookieMode);
    if (nextCookieHeader) headers.set('Cookie', nextCookieHeader);
  }

  headers.set('X-E-Pharmacy-Auth-Proxy', 'next-bff');

  const bffProxySecret = process.env.BFF_PROXY_SECRET?.trim();
  if (bffProxySecret) {
    headers.set(BFF_PROXY_SECRET_HEADER, bffProxySecret);
  }
  if (origin) headers.set('Origin', origin);
  if (referer) headers.set('Referer', referer);

  return headers;
}

//===================================================================

export async function getProxyBody(
  request: NextRequest,
  method: HttpMethod
): Promise<string | undefined> {
  if (method === 'GET' || method === 'DELETE') return undefined;

  const body = await request.text();

  return body || undefined;
}
