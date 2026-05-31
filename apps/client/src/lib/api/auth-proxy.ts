import { type NextRequest, type NextResponse } from 'next/server';

import {
  ACCESS_TOKEN_COOKIE_NAME,
  AUTH_COOKIE_MAX_AGE_SECONDS,
  AUTH_READY_COOKIE_NAME,
  LEGACY_AUTH_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_NAME,
} from '@/lib/auth/auth-session';

import { API_ROUTES } from '@/lib/constants/api-routes';

import { createApiUrl } from './api-url';
import { applyBackendAuthCookies } from './proxy-auth-cookies';
import { createProxyHeaders, getProxyBody } from './proxy-headers';
import { createProxyResponse } from './proxy-response';
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
    credentials: 'include',
  });

  const nextResponse = await createProxyResponse(response, {
    cacheControl: 'no-store',
    copySetCookie: false,
  });

  applyBackendAuthCookies(response, nextResponse, request);

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
