import 'server-only';
import { type NextRequest } from 'next/server';

import { apiRoutes as API_ROUTES } from '@e-pharmacy/api-client/contracts';
import { createBackendApiUrl } from '@/lib/api/server/backend-api-request';
import { createProxyHeaders, getProxyBody } from './proxy-headers';

import {
  clearClientAuthCookies,
  createCookieHeaderWithTokens,
  extractTokensFromResponseBody,
  setClientAuthCookies,
} from './proxy-auth-cookies';

import { createProxyResponse } from './proxy-response';
import type { HttpMethod } from '@e-pharmacy/api-client/core';

//===================================================================

type BackendProxyOptions = {
  backendPath: string;
  request: NextRequest;
  method?: HttpMethod;
};

type RefreshResult = {
  response: Response;
  tokens: ReturnType<typeof extractTokensFromResponseBody>['tokens'];
};

//===================================================================

const PRIVATE_REQUEST_TIMEOUT_MS = 12_000;
const AUTH_REFRESH_TIMEOUT_MS = 8_000;

let refreshPromise: Promise<RefreshResult> | null = null;

//===================================================================

function appendSearchParams(path: string, search: string): string {
  return search
    ? `${path}${search.startsWith('?') ? search : `?${search}`}`
    : path;
}

//===================================================================

async function refreshAuthCookies(
  request: NextRequest
): Promise<RefreshResult> {
  refreshPromise ??= fetch(createBackendApiUrl(API_ROUTES.auth.refresh), {
    method: 'POST',
    headers: createProxyHeaders(request),
    cache: 'no-store',
    signal: AbortSignal.timeout(AUTH_REFRESH_TIMEOUT_MS),
  })
    .then(async (response) => {
      const rawBody = await response.clone().text();
      const { tokens } = extractTokensFromResponseBody(rawBody);

      return { response, tokens };
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
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
}: BackendProxyOptions) {
  const body = await getProxyBody(request, method);

  const pathWithSearch =
    method === 'GET'
      ? appendSearchParams(backendPath, request.nextUrl.search)
      : backendPath;

  const response = await fetchBackend(request, pathWithSearch, method, body);

  if (response.status !== 401) {
    return createProxyResponse(response, {
      cacheControl: 'no-store',
    });
  }

  const { response: refreshResponse, tokens } =
    await refreshAuthCookies(request);

  if (!refreshResponse.ok) {
    const nextResponse = await createProxyResponse(response, {
      cacheControl: 'no-store',
    });

    clearClientAuthCookies(nextResponse, request);

    return nextResponse;
  }

  const cookieHeader = createCookieHeaderWithTokens(request, tokens);
  const retryResponse = await fetchBackend(
    request,
    pathWithSearch,
    method,
    body,
    cookieHeader
  );

  const nextResponse = await createProxyResponse(retryResponse, {
    cacheControl: 'no-store',
  });

  setClientAuthCookies(nextResponse, request, tokens);

  if (retryResponse.status === 401) {
    clearClientAuthCookies(nextResponse, request);
  }

  return nextResponse;
}
