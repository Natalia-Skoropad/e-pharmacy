import { type NextRequest } from 'next/server';

import type { HttpMethod } from './types';

//===================================================================

type ProxyHeadersOptions = {
  forwardAccept?: boolean;
  forwardContentType?: boolean;
  forwardCookie?: boolean;
};

//===================================================================

const AUTH_COOKIE_NAMES = new Set([
  'e_pharmacy_access_token',
  'e_pharmacy_refresh_token',
  'e_pharmacy_auth_token',
]);

//===================================================================

function normalizeCookieHeader(cookieHeader: string): string {
  const cookies = new Map<string, string>();

  cookieHeader
    .split(';')
    .map((cookie) => cookie.trim())
    .filter(Boolean)
    .forEach((cookie) => {
      const [name, ...valueParts] = cookie.split('=');
      const value = valueParts.join('=');

      if (!name || !value) return;

      if (AUTH_COOKIE_NAMES.has(name)) {
        // Keep the last auth cookie value if the browser sends duplicates.
        // This prevents stale cookies from shadowing the fresh login/refresh
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
  }: ProxyHeadersOptions = {}
): Headers {
  const headers = new Headers();
  const accept = request.headers.get('accept');
  const contentType = request.headers.get('content-type');
  const cookie = request.headers.get('cookie');
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');

  if (forwardAccept && accept) headers.set('Accept', accept);
  if (forwardContentType && contentType) headers.set('Content-Type', contentType);
  if (forwardCookie && cookie) {
    headers.set('Cookie', normalizeCookieHeader(cookie));
  }
  if (origin) headers.set('Origin', origin);
  if (referer) headers.set('Referer', referer);

  // Allows the backend to include raw tokens only in responses meant for the
  // Next.js BFF. The browser still receives httpOnly same-origin cookies only.
  headers.set('X-BFF-Auth-Proxy', '1');

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
