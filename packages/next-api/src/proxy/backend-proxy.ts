import type { NextRequest } from 'next/server';

import type { HttpMethod } from '@e-pharmacy/api-client/transport';

import { responseInvalidatesAuthSession } from '../internal/auth-error-code';
import { executeBackendFetch } from '../internal/backend-fetch';
import { validateBackendJsonResponse } from '../internal/backend-response';

import {
  clearClientAuthCookies,
  setClientAuthCookies,
} from '../internal/auth-cookies';

import {
  getRequestRefreshToken,
  refreshAuthSession,
  type AuthRefreshResult,
} from '../internal/auth-refresh';

import { createPrivateCookieHeaderWithAccessToken } from '../internal/cookie-header';

import { createProxyResponse } from '../internal/proxy-response';
import { readProxyRequestBody } from '../internal/request-body';

import {
  createInvalidBackendResponse,
  createProxyErrorResponse,
  describeProxyError,
} from '../internal/transport-error';

import { NEXT_API_TIMEOUTS_MS } from '../internal/transport-policy';
import { logTransportRequest } from '../observability/logger';

//===================================================================

type BackendProxyOptions = Readonly<{
  backendPath: string;
  request: NextRequest;
  requestId: string;
  method?: HttpMethod;
  clearAuthCookiesOnSuccess?: boolean;
}>;

//===================================================================

export async function proxyBackendRequest({
  backendPath,
  request,
  requestId,
  method = 'GET',
  clearAuthCookiesOnSuccess = false,
}: BackendProxyOptions) {
  const startedAt = Date.now();
  let body: string | undefined;
  let response: Response;

  try {
    body = await readProxyRequestBody(request, method);
    response = await executeBackendFetch({
      request,
      backendPath,
      method,
      requestId,
      timeoutMs: NEXT_API_TIMEOUTS_MS.privateRequest,
      authCookieMode: 'access-only',
      body,
    });
  } catch (error) {
    const descriptor = describeProxyError(error);

    logTransportRequest({
      requestId,
      method,
      path: backendPath,
      destination: 'backend',
      durationMs: Date.now() - startedAt,
      status: descriptor.status,
      authMode: 'private',
      transportErrorCode: descriptor.code,
      source: 'private-proxy',
    });

    return createProxyErrorResponse({ descriptor, requestId, request });
  }

  try {
    await validateBackendJsonResponse(response);
  } catch (error) {
    const descriptor = describeProxyError(error);
    return createProxyErrorResponse({ descriptor, requestId, request });
  }

  if (response.status !== 401) {
    const nextResponse = createProxyResponse(response, {
      cacheControl: 'no-store',
      requestId,
    });

    if (response.ok && clearAuthCookiesOnSuccess) {
      clearClientAuthCookies(nextResponse, request);
    }

    logTransportRequest({
      requestId,
      method,
      path: backendPath,
      destination: 'backend',
      durationMs: Date.now() - startedAt,
      status: response.status,
      authMode: 'private',
      source: 'private-proxy',
    });

    return nextResponse;
  }

  const refreshToken = getRequestRefreshToken(request);

  if (!refreshToken) {
    const shouldClearAuthCookies =
      await responseInvalidatesAuthSession(response);
    const nextResponse = createProxyResponse(response, {
      cacheControl: 'no-store',
      requestId,
    });

    if (shouldClearAuthCookies) {
      clearClientAuthCookies(nextResponse, request);
    }

    return nextResponse;
  }

  let refreshResult: AuthRefreshResult;

  try {
    refreshResult = await refreshAuthSession(request, requestId, refreshToken);
  } catch (error) {
    const descriptor = describeProxyError(error);

    logTransportRequest({
      requestId,
      method,
      path: backendPath,
      destination: 'backend',
      durationMs: Date.now() - startedAt,
      status: descriptor.status,
      authMode: 'private',
      refreshPerformed: true,
      transportErrorCode: descriptor.code,
      source: 'private-proxy',
    });

    // Temporary refresh transport failures must not destroy browser cookies.
    return createProxyErrorResponse({ descriptor, requestId, request });
  }

  if (!refreshResult.response.ok) {
    const nextResponse = createProxyResponse(refreshResult.response, {
      cacheControl: 'no-store',
      requestId,
    });

    if (await responseInvalidatesAuthSession(refreshResult.response)) {
      clearClientAuthCookies(nextResponse, request);
    }

    return nextResponse;
  }

  if (refreshResult.invalidTokenResponse || !refreshResult.tokens) {
    return createInvalidBackendResponse({
      requestId,
      request,
      clearAuthCookies: true,
      message: 'The session refresh response did not contain valid tokens.',
    });
  }

  const cookieHeader = createPrivateCookieHeaderWithAccessToken(
    request.headers.get('cookie'),
    refreshResult.tokens.accessToken
  );

  let retryResponse: Response;

  try {
    retryResponse = await executeBackendFetch({
      request,
      backendPath,
      method,
      requestId,
      timeoutMs: NEXT_API_TIMEOUTS_MS.privateRequest,
      authCookieMode: 'none',
      cookieHeaderOverride: cookieHeader,
      body,
    });
  } catch (error) {
    const descriptor = describeProxyError(error);
    return createProxyErrorResponse({ descriptor, requestId, request });
  }

  try {
    await validateBackendJsonResponse(retryResponse);
  } catch (error) {
    const descriptor = describeProxyError(error);
    return createProxyErrorResponse({ descriptor, requestId, request });
  }

  const nextResponse = createProxyResponse(retryResponse, {
    cacheControl: 'no-store',
    requestId,
  });

  if (await responseInvalidatesAuthSession(retryResponse)) {
    clearClientAuthCookies(nextResponse, request);
  } else {
    setClientAuthCookies(nextResponse, request, refreshResult.tokens);
  }

  if (retryResponse.ok && clearAuthCookiesOnSuccess) {
    clearClientAuthCookies(nextResponse, request);
  }

  logTransportRequest({
    requestId,
    method,
    path: backendPath,
    destination: 'backend',
    durationMs: Date.now() - startedAt,
    status: retryResponse.status,
    authMode: 'private',
    refreshPerformed: true,
    source: 'private-proxy',
  });

  return nextResponse;
}
