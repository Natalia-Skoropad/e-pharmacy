import 'server-only';
import { createHash } from 'crypto';
import { type NextRequest } from 'next/server';

import { apiRoutes as API_ROUTES } from '@e-pharmacy/api-client/contracts';
import { REFRESH_TOKEN_COOKIE_NAME } from '@e-pharmacy/config/auth';
import { createBackendApiUrl } from '@/lib/api/server/backend-api-request';
import { createProxyHeaders, getProxyBody } from './proxy-headers';

import {
  clearClientAuthCookies,
  createCookieHeaderWithTokens,
  extractTokensFromResponseBody,
  setClientAuthCookies,
} from './proxy-auth-cookies';

import { createProxyResponse } from './proxy-response';
import { createProxyTransportErrorResponse } from './proxy-transport-error';
import type { HttpMethod } from '@e-pharmacy/api-client/core';

//===================================================================

type BackendProxyOptions = {
  backendPath: string;
  request: NextRequest;
  method?: HttpMethod;
  clearAuthCookiesOnSuccess?: boolean;
};

type RefreshResult = {
  response: Response;
  tokens: ReturnType<typeof extractTokensFromResponseBody>['tokens'];
};

//===================================================================

const PRIVATE_REQUEST_TIMEOUT_MS = 12_000;
const AUTH_REFRESH_TIMEOUT_MS = 8_000;
const REFRESH_PROMISE_FALLBACK_KEY = 'anonymous';

//===================================================================

const refreshPromises = new Map<string, Promise<RefreshResult>>();

//===================================================================

function appendSearchParams(path: string, search: string): string {
  return search
    ? `${path}${search.startsWith('?') ? search : `?${search}`}`
    : path;
}

//===================================================================

function getRefreshFingerprint(request: NextRequest): string {
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE_NAME)?.value;
  const cookieHeader = request.headers.get('cookie') ?? '';
  const source = refreshToken || cookieHeader || REFRESH_PROMISE_FALLBACK_KEY;

  return createHash('sha256').update(source).digest('hex');
}

//===================================================================

async function refreshAuthCookies(
  request: NextRequest
): Promise<RefreshResult> {
  const refreshFingerprint = getRefreshFingerprint(request);
  const existingRefreshPromise = refreshPromises.get(refreshFingerprint);

  if (existingRefreshPromise) return existingRefreshPromise;

  const nextRefreshPromise = fetch(
    createBackendApiUrl(API_ROUTES.auth.refresh),
    {
      method: 'POST',
      headers: createProxyHeaders(request),
      cache: 'no-store',
      signal: AbortSignal.timeout(AUTH_REFRESH_TIMEOUT_MS),
    }
  )
    .then(async (response) => {
      const rawBody = await response.clone().text();
      const { tokens } = extractTokensFromResponseBody(rawBody);

      return { response, tokens };
    })
    .finally(() => {
      refreshPromises.delete(refreshFingerprint);
    });

  refreshPromises.set(refreshFingerprint, nextRefreshPromise);

  return nextRefreshPromise;
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

  return fetch(createBackendApiUrl(backendPath), {
    method,
    headers,
    body,
    cache: 'no-store',
    signal: AbortSignal.timeout(PRIVATE_REQUEST_TIMEOUT_MS),
  });
}

//===================================================================

/**
 * Proxies private same-origin `/api/*` requests to the backend API.
 * It forwards httpOnly cookies to the backend. If the access token is expired,
 * it refreshes once through the backend and retries with the fresh token before
 * returning the response to the browser.
 */
export async function proxyBackendRequest({
  backendPath,
  request,
  method = 'GET',
  clearAuthCookiesOnSuccess = false,
}: BackendProxyOptions) {
  const body = await getProxyBody(request, method);

  const pathWithSearch =
    method === 'GET'
      ? appendSearchParams(backendPath, request.nextUrl.search)
      : backendPath;

  let response: Response;

  try {
    response = await fetchBackend(request, pathWithSearch, method, body);
  } catch {
    return createProxyTransportErrorResponse({ request });
  }

  if (response.status !== 401) {
    const nextResponse = await createProxyResponse(response, {
      cacheControl: 'no-store',
    });

    if (response.ok && clearAuthCookiesOnSuccess) {
      clearClientAuthCookies(nextResponse, request);
    }

    return nextResponse;
  }

  let refreshResult: RefreshResult;

  try {
    refreshResult = await refreshAuthCookies(request);
  } catch {
    return createProxyTransportErrorResponse({
      request,
      clearAuthCookies: true,
    });
  }

  const { response: refreshResponse, tokens } = refreshResult;

  if (!refreshResponse.ok) {
    const nextResponse = await createProxyResponse(response, {
      cacheControl: 'no-store',
    });

    clearClientAuthCookies(nextResponse, request);

    return nextResponse;
  }

  const cookieHeader = createCookieHeaderWithTokens(request, tokens);
  let retryResponse: Response;

  try {
    retryResponse = await fetchBackend(
      request,
      pathWithSearch,
      method,
      body,
      cookieHeader
    );
  } catch {
    return createProxyTransportErrorResponse({ request });
  }

  const nextResponse = await createProxyResponse(retryResponse, {
    cacheControl: 'no-store',
  });

  setClientAuthCookies(nextResponse, request, tokens);

  if (retryResponse.ok && clearAuthCookiesOnSuccess) {
    clearClientAuthCookies(nextResponse, request);
    return nextResponse;
  }

  if (retryResponse.status === 401) {
    clearClientAuthCookies(nextResponse, request);
  }

  return nextResponse;
}
