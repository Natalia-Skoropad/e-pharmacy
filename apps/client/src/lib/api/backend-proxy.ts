import { type NextRequest, type NextResponse } from 'next/server';

import {
  ACCESS_TOKEN_COOKIE_NAME,
  AUTH_READY_COOKIE_NAME,
  LEGACY_AUTH_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_NAME,
} from '@/lib/auth/auth-session';

import { API_ROUTES } from '@/lib/constants/api-routes';
import { createApiUrl } from './api-url';

import {
  applyAuthTokensFromBody,
  applyBackendAuthCookies,
  getAuthTokensFromBody,
  getCookiePairFromSetCookie,
  getCookiePairsFromAuthTokens,
  getSetCookieHeaders,
} from './proxy-auth-cookies';

import { createProxyHeaders, getProxyBody } from './proxy-headers';
import { createProxyResponse } from './proxy-response';
import type { HttpMethod } from './types';

//===================================================================

type BackendProxyOptions = {
  backendPath: string;
  request: NextRequest;
  method?: HttpMethod;
};

//===================================================================

function parseCookieHeader(cookieHeader: string): Map<string, string> {
  const cookies = new Map<string, string>();

  cookieHeader
    .split(';')
    .map((item) => item.trim())
    .filter(Boolean)
    .forEach((cookie) => {
      const [name, ...valueParts] = cookie.split('=');
      const value = valueParts.join('=');

      if (!name || !value) return;

      cookies.set(name, value);
    });

  return cookies;
}

//===================================================================

async function createCookieHeaderWithRefreshCookies(
  request: NextRequest,
  refreshResponse: Response
): Promise<string | undefined> {
  const cookies = parseCookieHeader(request.headers.get('cookie') ?? '');
  const refreshBody = await refreshResponse.clone().text();
  const refreshedCookiePairs = [
    ...getCookiePairsFromAuthTokens(getAuthTokensFromBody(refreshBody)),
    ...getSetCookieHeaders(refreshResponse.headers)
      .map(getCookiePairFromSetCookie)
      .filter((pair): pair is string => Boolean(pair)),
  ];

  refreshedCookiePairs.forEach((pair) => {
    const [name, ...valueParts] = pair.split('=');
    const value = valueParts.join('=');

    if (!name || !value) return;

    // Replace stale access/refresh cookies instead of appending duplicates.
    // Express reads the first cookie with a matching name, so duplicated cookie
    // names could make the retry keep using an expired access token.
    cookies.set(name, value);
  });

  const cookieHeader = Array.from(cookies.entries())
    .map(([name, value]) => `${name}=${value}`)
    .join('; ');

  return cookieHeader || undefined;
}

//===================================================================

function copyRefreshCookies(
  refreshResponse: Response,
  target: NextResponse,
  request: NextRequest
): void {
  applyBackendAuthCookies(refreshResponse, target, request);
}

//===================================================================

function isSecureRequest(request: NextRequest): boolean {
  return request.nextUrl.protocol === 'https:';
}

//===================================================================

function clearClientAuthCookies(
  target: NextResponse,
  request: NextRequest
): void {
  const cookieOptions = {
    path: '/',
    maxAge: 0,
    sameSite: 'lax' as const,
    secure: isSecureRequest(request),
  };

  target.cookies.set(ACCESS_TOKEN_COOKIE_NAME, '', cookieOptions);
  target.cookies.set(REFRESH_TOKEN_COOKIE_NAME, '', cookieOptions);
  target.cookies.set(LEGACY_AUTH_COOKIE_NAME, '', cookieOptions);
  target.cookies.set(AUTH_READY_COOKIE_NAME, '', cookieOptions);
}

//===================================================================

async function refreshAuthCookies(request: NextRequest): Promise<Response> {
  return fetch(createApiUrl(API_ROUTES.auth.refresh), {
    method: 'POST',
    headers: createProxyHeaders(request),
    cache: 'no-store',
    credentials: 'include',
  });
}

//===================================================================

async function fetchBackend(
  request: NextRequest,
  backendPath: string,
  method: HttpMethod,
  body: string | undefined,
  cookieHeader?: string
): Promise<Response> {
  const headers = createProxyHeaders(request);

  if (cookieHeader) {
    headers.set('Cookie', cookieHeader);
  }

  return fetch(createApiUrl(backendPath), {
    method,
    headers,
    body,
    cache: 'no-store',
    credentials: 'include',
  });
}

//===================================================================

/**
 * Proxies private same-origin `/api/*` requests to the backend API.
 * It forwards cookies so httpOnly auth can work without exposing tokens
 * to browser JavaScript. If an access token expired but the refresh token is
 * still valid, it refreshes cookies once and retries the original request.
 */
export async function proxyBackendRequest({
  backendPath,
  request,
  method = 'GET',
}: BackendProxyOptions) {
  const body = await getProxyBody(request, method);
  const response = await fetchBackend(request, backendPath, method, body);

  if (response.status !== 401) {
    const nextResponse = await createProxyResponse(response, {
      cacheControl: 'no-store',
      copySetCookie: false,
    });

    applyBackendAuthCookies(response, nextResponse, request);

    return nextResponse;
  }

  const refreshResponse = await refreshAuthCookies(request);

  if (!refreshResponse.ok) {
    const nextResponse = await createProxyResponse(response, {
      cacheControl: 'no-store',
      copySetCookie: false,
    });

    clearClientAuthCookies(nextResponse, request);

    return nextResponse;
  }

  const cookieHeader = await createCookieHeaderWithRefreshCookies(
    request,
    refreshResponse
  );
  const retryResponse = await fetchBackend(
    request,
    backendPath,
    method,
    body,
    cookieHeader
  );

  const nextResponse = await createProxyResponse(retryResponse, {
    cacheControl: 'no-store',
    copySetCookie: false,
  });

  applyBackendAuthCookies(retryResponse, nextResponse, request);
  copyRefreshCookies(refreshResponse, nextResponse, request);
  applyAuthTokensFromBody(
    await refreshResponse.clone().text(),
    nextResponse,
    request
  );

  if (retryResponse.status === 401) {
    clearClientAuthCookies(nextResponse, request);
  }

  return nextResponse;
}
