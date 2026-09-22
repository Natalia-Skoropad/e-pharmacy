import type { NextRequest } from 'next/server';

import {
  ApiError,
  executeFetchWithRetry,
  type FetchExecutionResult,
  type HttpMethod,
  type RequestOptions,
} from '@e-pharmacy/api-client/transport';

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

export async function executeBackendFetch(
  options: ExecuteBackendFetchOptions
): Promise<Response> {
  const { url, init } = createBackendFetchTarget(options);
  const timeoutSignal = AbortSignal.timeout(options.timeoutMs);
  const signal = AbortSignal.any([options.request.signal, timeoutSignal]);

  try {
    return await fetch(url, {
      ...init,
      method: options.method,
      signal,
    });
  } catch (error) {
    if (options.request.signal.aborted) {
      throw new ApiError('The request was cancelled.', {
        transportCode: 'ABORTED',
        url,
        method: options.method,
        cause: error,
      });
    }

    if (timeoutSignal.aborted) {
      throw new ApiError('The service did not respond in time.', {
        transportCode: 'TIMEOUT',
        url,
        method: options.method,
        cause: error,
      });
    }

    throw error;
  }
}

//===================================================================

export function executeBackendFetchWithRetry(
  options: ExecuteBackendFetchWithRetryOptions
): Promise<FetchExecutionResult> {
  const { url, init } = createBackendFetchTarget(options);

  return executeFetchWithRetry(url, {
    method: options.method,
    init,
    signal: options.request.signal,
    timeoutMs: options.timeoutMs,
    retry: options.retry,
    validateResponse: options.validateResponse,
  });
}
