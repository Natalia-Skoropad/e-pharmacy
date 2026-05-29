import { NextResponse, type NextRequest } from 'next/server';

import { API_ROUTES } from '@/lib/constants/api-routes';
import { createApiUrl } from './api-url';

//===================================================================

type AuthProxyOptions = {
  backendPath: string;
  request: NextRequest;
  method?: 'GET' | 'POST' | 'PATCH';
};

//===================================================================

function createProxyHeaders(request: NextRequest): Headers {
  const headers = new Headers();
  const contentType = request.headers.get('content-type');
  const cookie = request.headers.get('cookie');

  if (contentType) headers.set('Content-Type', contentType);
  if (cookie) headers.set('Cookie', cookie);

  return headers;
}

//===================================================================

async function getProxyBody(
  request: NextRequest,
  method: AuthProxyOptions['method']
): Promise<string | undefined> {
  if (method === 'GET') return undefined;

  const body = await request.text();

  return body || undefined;
}

//===================================================================

function copyAuthCookie(source: Response, target: NextResponse): void {
  const setCookie = source.headers.get('set-cookie');

  if (!setCookie) return;

  target.headers.set('set-cookie', setCookie);
}

//===================================================================

async function createProxyResponse(response: Response): Promise<NextResponse> {
  const contentType = response.headers.get('content-type');
  const body = await response.text();

  const nextResponse = new NextResponse(body || null, {
    status: response.status,
  });

  if (contentType) {
    nextResponse.headers.set('Content-Type', contentType);
  }

  nextResponse.headers.set('Cache-Control', 'no-store');
  copyAuthCookie(response, nextResponse);

  return nextResponse;
}

//===================================================================

export async function proxyAuthRequest({
  backendPath,
  request,
  method = 'POST',
}: AuthProxyOptions): Promise<NextResponse> {
  const response = await fetch(createApiUrl(backendPath), {
    method,
    headers: createProxyHeaders(request),
    body: await getProxyBody(request, method),
    cache: 'no-store',
    credentials: 'include',
  });

  return createProxyResponse(response);
}

//===================================================================

export const AUTH_PROXY_ROUTES = {
  register: API_ROUTES.auth.register,
  login: API_ROUTES.auth.login,
  logout: API_ROUTES.auth.logout,
  current: API_ROUTES.auth.current,
  password: API_ROUTES.auth.password,
  forgotPassword: API_ROUTES.auth.forgotPassword,
  resetPassword: API_ROUTES.auth.resetPassword,
} as const;
