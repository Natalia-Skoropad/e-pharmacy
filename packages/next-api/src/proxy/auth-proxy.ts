import type { NextRequest } from 'next/server';

import type { HttpMethod } from '@e-pharmacy/api-client/transport';

import { executeBackendFetch } from '../internal/backend-fetch';
import { isJsonContentType } from '../internal/backend-response';
import type { AuthCookieForwardMode } from '../internal/cookie-header';

import {
  clearClientAuthCookies,
  setClientAuthCookies,
} from '../internal/auth-cookies';

import {
  getAuthErrorCodeFromBody,
  isInvalidatingAuthErrorCode,
} from '../internal/auth-error-code';

import { transformAuthResponseBody } from '../internal/auth-tokens';
import { createTextProxyResponse } from '../internal/proxy-response';
import { readProxyRequestBody } from '../internal/request-body';

import {
  createInvalidBackendResponse,
  createProxyErrorResponse,
  describeProxyError,
} from '../internal/transport-error';

import { NEXT_API_TIMEOUTS_MS } from '../internal/transport-policy';
import { logTransportRequest } from '../observability/logger';

//===================================================================

export type AuthMarkerAction = 'set' | 'delete';

//===================================================================

type AuthProxyOptions = Readonly<{
  backendPath: string;
  request: NextRequest;
  requestId: string;
  method?: Extract<HttpMethod, 'GET' | 'POST' | 'PATCH'>;
  markerAction?: AuthMarkerAction;
  authCookieMode: AuthCookieForwardMode;
}>;

//===================================================================

export async function proxyAuthRequest({
  backendPath,
  request,
  requestId,
  method = 'POST',
  markerAction,
  authCookieMode,
}: AuthProxyOptions) {
  const startedAt = Date.now();
  let response: Response;

  try {
    const body = await readProxyRequestBody(request, method);

    response = await executeBackendFetch({
      request,
      backendPath,
      method,
      requestId,
      timeoutMs: NEXT_API_TIMEOUTS_MS.authRequest,
      authCookieMode,
      body,
      includeAuthProxyMarker: true,
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
      authMode: 'auth',
      transportErrorCode: descriptor.code,
      source: 'auth-proxy',
    });

    return createProxyErrorResponse({
      descriptor,
      requestId,
      request,
      clearAuthCookies: markerAction === 'delete',
    });
  }

  const contentType = response.headers.get('content-type');
  const rawBody = await response.text();
  const transformed = transformAuthResponseBody(rawBody);

  if (
    (response.status !== 204 && !isJsonContentType(contentType)) ||
    transformed.issue === 'invalid-json'
  ) {
    return createInvalidBackendResponse({
      requestId,
      request,
      clearAuthCookies: markerAction === 'set',
    });
  }

  if (response.ok && markerAction === 'set' && !transformed.tokens) {
    logTransportRequest({
      requestId,
      method,
      path: backendPath,
      destination: 'backend',
      durationMs: Date.now() - startedAt,
      status: 502,
      authMode: 'auth',
      transportErrorCode: 'INVALID_BACKEND_RESPONSE',
      source: 'auth-proxy',
    });

    return createInvalidBackendResponse({
      requestId,
      request,
      clearAuthCookies: true,
      message:
        'Authentication succeeded without a valid session token response.',
    });
  }

  const safeBody = transformed.body || rawBody;
  const authErrorCode = getAuthErrorCodeFromBody(safeBody);

  const nextResponse = createTextProxyResponse(response, safeBody, {
    cacheControl: 'no-store',
    requestId,
  });

  if (response.ok && markerAction === 'set' && transformed.tokens) {
    clearClientAuthCookies(nextResponse, request);
    setClientAuthCookies(nextResponse, request, transformed.tokens);
  } else if (
    markerAction === 'set' &&
    isInvalidatingAuthErrorCode(authErrorCode)
  ) {
    clearClientAuthCookies(nextResponse, request);
  }

  if (markerAction === 'delete') {
    clearClientAuthCookies(nextResponse, request);
  }

  logTransportRequest({
    requestId,
    method,
    path: backendPath,
    destination: 'backend',
    durationMs: Date.now() - startedAt,
    status: response.status,
    authMode: 'auth',
    source: 'auth-proxy',
  });

  return nextResponse;
}
