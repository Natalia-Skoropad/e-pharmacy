import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';

import { clearClientAuthCookies } from './proxy-auth-cookies';

//===================================================================

const SERVICE_UNAVAILABLE_STATUS = 503;
const NO_STORE_CACHE_CONTROL = 'no-store';

//===================================================================

type ProxyTransportErrorResponseOptions = {
  request?: NextRequest;
  clearAuthCookies?: boolean;
  message?: string;
};

//===================================================================

export function createProxyTransportErrorResponse({
  request,
  clearAuthCookies: shouldClearAuthCookies = false,
  message = 'The service is temporarily unavailable.',
}: ProxyTransportErrorResponseOptions = {}): NextResponse {
  const response = NextResponse.json(
    {
      success: false,
      message,
    },
    {
      status: SERVICE_UNAVAILABLE_STATUS,
      headers: {
        'Cache-Control': NO_STORE_CACHE_CONTROL,
      },
    }
  );

  if (request && shouldClearAuthCookies) {
    clearClientAuthCookies(response, request);
  }

  return response;
}
