import { NextResponse, type NextRequest } from 'next/server';

import { apiRoutes as API_ROUTES } from '../routes';
import { createApiUrl } from '../core/api-url';
import { copySetCookieHeader } from './proxy-response';
import { createProxyHeaders, getProxyBody } from './proxy-headers';

import {
  clearClientAuthCookies,
  extractTokensFromResponseBody,
  setClientAuthCookies,
} from './proxy-auth-cookies';

import type { HttpMethod } from '../core/types';

//===================================================================

type AuthMarkerAction = 'set' | 'delete';

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

  // Keep backward compatibility with backend Set-Cookie when it is visible to
  // the Next runtime, but do not rely on it. On Vercel it can be unavailable
  // for cross-origin fetch responses, so tokens are also passed in the BFF-only
  // JSON field and converted to httpOnly frontend-domain cookies below.
  copySetCookieHeader(response, nextResponse);

  if (response.ok && markerAction === 'set') {
    setClientAuthCookies(nextResponse, request, tokens);
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
  const response = await fetch(createApiUrl(backendPath), {
    method,
    headers: createProxyHeaders(request),
    body: await getProxyBody(request, method),
    cache: 'no-store',
  });

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
