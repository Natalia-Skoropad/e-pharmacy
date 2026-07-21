import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';

import { apiRoutes as API_ROUTES } from '@e-pharmacy/api-client/contracts';
import { createBackendApiUrl } from '../server/backend-api-request';
import { createProxyTransportErrorResponse } from './proxy-transport-error';
import { createProxyHeaders, getProxyBody } from './proxy-headers';

import {
  clearClientAuthCookies,
  extractTokensFromResponseBody,
  setClientAuthCookies,
} from './proxy-auth-cookies';

import type { HttpMethod } from '@e-pharmacy/api-client/core';

//===================================================================

const AUTH_PROXY_TIMEOUT_MS = 20_000;

//===================================================================

export type AuthMarkerAction = 'set' | 'delete';

//===================================================================

type AuthProxyOptions = {
  backendPath: string;
  request: NextRequest;
  method?: Extract<HttpMethod, 'GET' | 'POST' | 'PATCH'>;
  markerAction?: AuthMarkerAction;
};

//===================================================================

async function createAuthProxyResponse(
  response: Response,
  request: NextRequest,
  markerAction?: AuthMarkerAction
): Promise<NextResponse> {
  const contentType = response.headers.get('content-type');
  const rawBody = await response.text();
  const { body, tokens } = extractTokensFromResponseBody(rawBody);

  const nextResponse = new NextResponse(body || null, {
    status: response.status,
  });

  if (contentType) {
    nextResponse.headers.set('Content-Type', contentType);
  }

  nextResponse.headers.set('Cache-Control', 'no-store');

  // The BFF is the only component that writes browser auth cookies.
  // Backend Set-Cookie headers are intentionally not forwarded because doing
  // both creates duplicate domain/path variants and makes refresh behavior
  // depend on browser cookie ordering.

  if (response.ok && markerAction === 'set') {
    clearClientAuthCookies(nextResponse, request);
    setClientAuthCookies(nextResponse, request, tokens);
  } else if (
    markerAction === 'set' &&
    (response.status === 401 || response.status === 403)
  ) {
    clearClientAuthCookies(nextResponse, request);
  }

  if (markerAction === 'delete') {
    clearClientAuthCookies(nextResponse, request);
  }

  return nextResponse;
}

//===================================================================

export async function proxyAuthRequest({
  backendPath,
  request,
  method = 'POST',
  markerAction,
}: AuthProxyOptions) {
  let response: Response;

  try {
    response = await fetch(createBackendApiUrl(backendPath), {
      method,
      headers: createProxyHeaders(request, {
        authCookieMode:
          backendPath === API_ROUTES.auth.refresh ? 'refresh-only' : 'all',
      }),
      body: await getProxyBody(request, method),
      cache: 'no-store',
      signal: AbortSignal.timeout(AUTH_PROXY_TIMEOUT_MS),
    });
  } catch (error) {
    console.error('[auth-proxy] Backend request failed', {
      backendPath,
      method,
      apiBaseUrlConfigured: Boolean(process.env.API_BASE_URL?.trim()),
      error,
    });

    return createProxyTransportErrorResponse({
      request,
      clearAuthCookies: markerAction === 'delete',
    });
  }

  return createAuthProxyResponse(response, request, markerAction);
}

//===================================================================

export const AUTH_PROXY_ROUTES = {
  register: API_ROUTES.auth.register,
  login: API_ROUTES.auth.login,
  logout: API_ROUTES.auth.logout,
  logoutAll: API_ROUTES.auth.logoutAll,
  refresh: API_ROUTES.auth.refresh,
  current: API_ROUTES.auth.current,
  password: API_ROUTES.auth.password,
  sessions: API_ROUTES.auth.sessions,
  session: API_ROUTES.auth.session,
  passwordResetRequest: API_ROUTES.auth.passwordResetRequest,
  passwordResetConfirm: API_ROUTES.auth.passwordResetConfirm,
} as const;
