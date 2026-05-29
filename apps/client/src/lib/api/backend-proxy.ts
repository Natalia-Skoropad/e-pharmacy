import { NextResponse, type NextRequest } from 'next/server';

import { createApiUrl } from './api-url';
import type { HttpMethod } from './types';

//===================================================================

type BackendProxyOptions = {
  backendPath: string;
  request: NextRequest;
  method?: HttpMethod;
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
  method: HttpMethod
): Promise<string | undefined> {
  if (method === 'GET' || method === 'DELETE') return undefined;

  const body = await request.text();

  return body || undefined;
}

//===================================================================

function copySetCookieHeader(source: Response, target: NextResponse): void {
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
  copySetCookieHeader(response, nextResponse);

  return nextResponse;
}

//===================================================================

/**
 * Proxies private same-origin `/api/*` requests to the backend API.
 * It forwards cookies so httpOnly auth can work without exposing tokens
 * to browser JavaScript.
 */
export async function proxyBackendRequest({
  backendPath,
  request,
  method = 'GET',
}: BackendProxyOptions): Promise<NextResponse> {
  const response = await fetch(createApiUrl(backendPath), {
    method,
    headers: createProxyHeaders(request),
    body: await getProxyBody(request, method),
    cache: 'no-store',
    credentials: 'include',
  });

  return createProxyResponse(response);
}
