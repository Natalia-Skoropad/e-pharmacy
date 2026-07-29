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
  return new NextResponse(body || null, {
    status: response.status,

    headers: createProxyResponseHeaders(
      response.headers,
      options.cacheControl,
      options.requestId
    ),
  });
}

//===================================================================

export function createProxyResponse(
  response: Response,
  options: ProxyResponseOptions
): NextResponse {
  return new NextResponse(response.body, {
    status: response.status,

    headers: createProxyResponseHeaders(
      response.headers,
      options.cacheControl,
      options.requestId
    ),
  });
}
