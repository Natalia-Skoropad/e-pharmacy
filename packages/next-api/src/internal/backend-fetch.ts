import type { NextRequest } from 'next/server';

import {
  executeFetchWithRetry,
  type FetchExecutionResult,
  type HttpMethod,
  type RequestOptions,
} from '@e-pharmacy/api-client/core';

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

type ExecuteBackendFetchWithRetryOptions = ExecuteBackendFetchOptions &
  Readonly<{
    retry?: RequestOptions['retry'];
    validateResponse?: (response: Response) => void | Promise<void>;
  }>;

//===================================================================

function createBackendFetchTarget({
  request,
  backendPath,
  requestId,
  authCookieMode,
  body,
  cookieHeaderOverride,
  forwardAccept = false,
  includeAuthProxyMarker = false,
  forwardSearchParams = true,
}: ExecuteBackendFetchOptions): {
  url: string;
  init: Omit<RequestInit, 'method' | 'signal'>;
} {
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

  return {
    url: createTrustedBackendApiUrl(pathWithSearch),
    init: {
      headers,
      body,
      cache: 'no-store',
      redirect: 'manual',
    },
  };
}

//===================================================================

export function executeBackendFetch(
  options: ExecuteBackendFetchOptions
): Promise<Response> {
  const { url, init } = createBackendFetchTarget(options);

  return fetch(url, {
    ...init,
    method: options.method,
    signal: AbortSignal.timeout(options.timeoutMs),
  });
}

//===================================================================

export function executeBackendFetchWithRetry(
  options: ExecuteBackendFetchWithRetryOptions
): Promise<FetchExecutionResult> {
  const { url, init } = createBackendFetchTarget(options);

  return executeFetchWithRetry(url, {
    method: options.method,
    init,
    timeoutMs: options.timeoutMs,
    retry: options.retry,
    validateResponse: options.validateResponse,
  });
}
