import { type NextRequest } from 'next/server';

import type { HttpMethod } from './types';

//===================================================================

type ProxyHeadersOptions = {
  forwardAccept?: boolean;
  forwardContentType?: boolean;
  forwardCookie?: boolean;
};

//===================================================================

export function createProxyHeaders(
  request: NextRequest,
  {
    forwardAccept = false,
    forwardContentType = true,
    forwardCookie = true,
  }: ProxyHeadersOptions = {}
): Headers {
  const headers = new Headers();
  const accept = request.headers.get('accept');
  const contentType = request.headers.get('content-type');
  const cookie = request.headers.get('cookie');

  if (forwardAccept && accept) headers.set('Accept', accept);
  if (forwardContentType && contentType) headers.set('Content-Type', contentType);
  if (forwardCookie && cookie) headers.set('Cookie', cookie);

  return headers;
}

//===================================================================

export async function getProxyBody(
  request: NextRequest,
  method: HttpMethod
): Promise<string | undefined> {
  if (method === 'GET' || method === 'DELETE') return undefined;

  const body = await request.text();

  return body || undefined;
}
