import { type NextRequest, type NextResponse } from 'next/server';

import { API_ROUTES } from '@/lib/constants/api-routes';

import { createApiUrl } from './api-url';
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

function getSetCookieHeaders(headers: Headers): string[] {
  const headersWithSetCookie = headers as Headers & {
    getSetCookie?: () => string[];
  };

  const setCookieHeaders = headersWithSetCookie.getSetCookie?.();
  if (setCookieHeaders?.length) return setCookieHeaders;

  const setCookie = headers.get('set-cookie');

  return setCookie ? [setCookie] : [];
}

//===================================================================

function getCookiePairFromSetCookie(setCookie: string): string | null {
  return setCookie.split(';')[0] || null;
}

//===================================================================

function createCookieHeaderWithRefreshCookies(
  request: NextRequest,
  refreshResponse: Response
): string | undefined {
  const currentCookie = request.headers.get('cookie') ?? '';
  const refreshedCookiePairs = getSetCookieHeaders(refreshResponse.headers)
    .map(getCookiePairFromSetCookie)
    .filter(Boolean) as string[];

  if (refreshedCookiePairs.length === 0) return currentCookie || undefined;

  return [currentCookie, ...refreshedCookiePairs].filter(Boolean).join('; ');
}

//===================================================================

function copyRefreshCookies(refreshResponse: Response, target: NextResponse): void {
  getSetCookieHeaders(refreshResponse.headers).forEach((setCookie) => {
    target.headers.append('set-cookie', setCookie);
  });
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
    return createProxyResponse(response, {
      cacheControl: 'no-store',
    });
  }

  const refreshResponse = await refreshAuthCookies(request);

  if (!refreshResponse.ok) {
    return createProxyResponse(response, {
      cacheControl: 'no-store',
    });
  }

  const cookieHeader = createCookieHeaderWithRefreshCookies(request, refreshResponse);
  const retryResponse = await fetchBackend(
    request,
    backendPath,
    method,
    body,
    cookieHeader
  );

  const nextResponse = await createProxyResponse(retryResponse, {
    cacheControl: 'no-store',
  });

  copyRefreshCookies(refreshResponse, nextResponse);

  return nextResponse;
}
