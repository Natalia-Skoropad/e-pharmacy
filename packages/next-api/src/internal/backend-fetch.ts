import 'server-only';
import type { NextRequest } from 'next/server';

import type { HttpMethod } from '@e-pharmacy/api-client/core';

import { createTrustedBackendApiUrl } from './backend-url';
import type { AuthCookieForwardMode } from './cookie-header';
import { appendSearchParams } from './query';
import { createProxyRequestHeaders } from './request-headers';

//===================================================================

type ExecuteBackendFetchOptions = Readonly<{
  request: NextRequest;
  backendPath: string;
  method: HttpMethod;
  requestId: string;
  timeoutMs: number;
  authCookieMode: AuthCookieForwardMode;
  body?: string;
  cookieHeaderOverride?: string;
  forwardAccept?: boolean;
  includeAuthProxyMarker?: boolean;
  forwardSearchParams?: boolean;
}>;

//===================================================================

export function executeBackendFetch({
  request,
  backendPath,
  method,
  requestId,
  timeoutMs,
  authCookieMode,
  body,
  cookieHeaderOverride,
  forwardAccept = false,
  includeAuthProxyMarker = false,
  forwardSearchParams = true,
}: ExecuteBackendFetchOptions): Promise<Response> {
  const pathWithSearch = forwardSearchParams
    ? appendSearchParams(backendPath, request.nextUrl.search)
    : backendPath;

  const headers = createProxyRequestHeaders(request, {
    authCookieMode,
    requestId,
    forwardAccept,
    forwardContentType: body !== undefined,
    includeAuthProxyMarker,
  });

  if (cookieHeaderOverride) headers.set('Cookie', cookieHeaderOverride);

  return fetch(createTrustedBackendApiUrl(pathWithSearch), {
    method,
    headers,
    body,
    cache: 'no-store',
    redirect: 'manual',
    signal: AbortSignal.timeout(timeoutMs),
  });
}
