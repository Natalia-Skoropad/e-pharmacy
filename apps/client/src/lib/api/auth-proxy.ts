import { type NextRequest, NextResponse } from 'next/server';

import {
  ACCESS_TOKEN_COOKIE_NAME,
  AUTH_COOKIE_MAX_AGE_SECONDS,
  AUTH_READY_COOKIE_NAME,
  LEGACY_AUTH_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_NAME,
} from '@/lib/auth/auth-session';

import { API_ROUTES } from '@/lib/constants/api-routes';

import { createApiUrl } from './api-url';

import {
  applyBackendAuthCookies,
  getAuthTokensFromPayload,
  setFrontendAuthCookiesFromTokens,
  stripAuthTokensFromPayload,
  type ProxyAuthTokens,
} from './proxy-auth-cookies';

import { createProxyHeaders, getProxyBody } from './proxy-headers';
import type { HttpMethod } from './types';

//===================================================================

type AuthMarkerAction = 'set' | 'delete';

type AuthProxyOptions = {
  backendPath: string;
  request: NextRequest;
  method?: Extract<HttpMethod, 'GET' | 'POST' | 'PATCH'>;
  markerAction?: AuthMarkerAction;
};

//===================================================================

function isSecureRequest(request: NextRequest): boolean {
  return request.nextUrl.protocol === 'https:';
}

//===================================================================

function createBackendAuthHeaders(request: NextRequest): Headers {
  const headers = createProxyHeaders(request);

  // Internal marker for our Express API. It allows the API to include raw
  // tokens only in server-to-server responses to this Next.js BFF route. The
  // BFF immediately moves them into httpOnly frontend cookies and strips them
  // from the JSON sent to the browser.
  headers.set('x-e-pharmacy-bff-auth', '1');

  return headers;
}

//===================================================================

function syncAuthMarkerCookie(
  nextResponse: NextResponse,
  request: NextRequest,
  action?: AuthMarkerAction
): void {
  if (!action) return;

  if (action === 'delete') {
    const cookieOptions = {
      path: '/',
      maxAge: 0,
      sameSite: 'lax' as const,
      secure: isSecureRequest(request),
    };

    nextResponse.cookies.set(AUTH_READY_COOKIE_NAME, '', cookieOptions);
    nextResponse.cookies.set(ACCESS_TOKEN_COOKIE_NAME, '', cookieOptions);
    nextResponse.cookies.set(REFRESH_TOKEN_COOKIE_NAME, '', cookieOptions);
    nextResponse.cookies.set(LEGACY_AUTH_COOKIE_NAME, '', cookieOptions);
    return;
  }

  nextResponse.cookies.set(AUTH_READY_COOKIE_NAME, '1', {
    path: '/',
    maxAge: AUTH_COOKIE_MAX_AGE_SECONDS,
    sameSite: 'lax',
    secure: isSecureRequest(request),
  });
}

//===================================================================

async function createSanitizedAuthResponse(
  response: Response,
  request: NextRequest
): Promise<NextResponse> {
  const contentType = response.headers.get('content-type');
  const body = await response.text();
  let tokens: ProxyAuthTokens | null = null;
  let responseBody: BodyInit | null = body || null;

  if (contentType?.includes('application/json') && body) {
    try {
      const payload = JSON.parse(body) as unknown;

      tokens = getAuthTokensFromPayload(payload);
      responseBody = JSON.stringify(stripAuthTokensFromPayload(payload));
    } catch {
      responseBody = body;
    }
  }

  const nextResponse = new NextResponse(responseBody, {
    status: response.status,
  });

  if (contentType) {
    nextResponse.headers.set('Content-Type', contentType);
  }

  nextResponse.headers.set('Cache-Control', 'no-store');

  applyBackendAuthCookies(response, nextResponse, request);
  setFrontendAuthCookiesFromTokens(tokens, nextResponse, request);

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
    headers: createBackendAuthHeaders(request),
    body: await getProxyBody(request, method),
    cache: 'no-store',
    credentials: 'include',
  });

  const nextResponse = await createSanitizedAuthResponse(response, request);

  if (response.ok || markerAction === 'delete') {
    syncAuthMarkerCookie(nextResponse, request, markerAction);
  }

  return nextResponse;
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
  forgotPassword: API_ROUTES.auth.forgotPassword,
  resetPassword: API_ROUTES.auth.resetPassword,
} as const;
