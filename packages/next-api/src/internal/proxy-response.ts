import { NextResponse } from 'next/server';

import { createProxyResponseHeaders } from './response-headers';

//===================================================================

type ProxyResponseOptions = Readonly<{
  cacheControl: string;
  requestId: string;
}>;

//===================================================================

export function createTextProxyResponse(
  response: Response,
  body: string,
  options: ProxyResponseOptions
): NextResponse {
  const headers = createProxyResponseHeaders(
    response.headers,
    options.cacheControl,
    options.requestId
  );

  headers.delete('content-length');
  headers.delete('etag');
  headers.delete('last-modified');

  return new NextResponse(body || null, {
    status: response.status,
    headers,
  });
}

//===================================================================

export function createProxyResponse(
  response: Response,
  options: ProxyResponseOptions
): NextResponse {
  const headers = createProxyResponseHeaders(
    response.headers,
    options.cacheControl,
    options.requestId
  );

  if (response.status === 204 || response.status === 205) {
    headers.delete('content-length');
    headers.delete('content-type');

    return new NextResponse(null, {
      status: response.status,
      headers,
    });
  }

  return new NextResponse(response.body, {
    status: response.status,
    headers,
  });
}
