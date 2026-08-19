import type { NextRequest } from 'next/server';

import { executeBackendFetchWithRetry } from '../internal/backend-fetch';

import {
  createPublicCacheControl,
  resolvePublicRevalidate,
} from '../internal/cache-policy';

import { validateBackendApiEnvelopeResponse } from '../internal/backend-response';
import { createProxyResponse } from '../internal/proxy-response';

import {
  createProxyErrorResponse,
  describeProxyError,
} from '../internal/transport-error';

import {
  NEXT_API_TIMEOUTS_MS,
  PUBLIC_READ_RETRY_POLICY,
} from '../internal/transport-policy';

import { logTransportRequest } from '../observability/logger';

//===================================================================

type PublicBackendProxyOptions = Readonly<{
  backendPath: string;
  request: NextRequest;
  requestId: string;
  revalidate?: number | false;
  staleWhileRevalidate?: number;
}>;

//===================================================================

export async function proxyPublicBackendRequest({
  backendPath,
  request,
  requestId,
  revalidate,
  staleWhileRevalidate,
}: PublicBackendProxyOptions) {
  const startedAt = Date.now();
  const resolvedRevalidate = resolvePublicRevalidate(revalidate);
  let observedRetryCount: number | undefined;

  try {
    const execution = await executeBackendFetchWithRetry({
      request,
      backendPath,
      method: 'GET',
      requestId,
      timeoutMs: NEXT_API_TIMEOUTS_MS.publicRead,
      authCookieMode: 'none',
      forwardAccept: true,
      retry: PUBLIC_READ_RETRY_POLICY,
    });

    observedRetryCount = execution.retryCount;

    try {
      // Retry ownership stays status-based. A syntactically valid but malformed
      // 2xx API envelope is a contract failure, not a transient read failure,
      // so validate it once after retries and before assigning cache headers.
      await validateBackendApiEnvelopeResponse(execution.response);

      const cacheControl = execution.response.ok
        ? createPublicCacheControl(resolvedRevalidate, staleWhileRevalidate)
        : 'no-store';

      logTransportRequest({
        requestId,
        method: 'GET',
        path: backendPath,
        destination: 'backend',
        durationMs: Date.now() - startedAt,
        status: execution.response.status,
        retryCount: execution.retryCount,
        authMode: 'public',
        cachePolicy: cacheControl,
        source: 'public-proxy',
      });

      return createProxyResponse(execution.response, {
        cacheControl,
        requestId,
      });
    } finally {
      execution.cleanup();
    }
  } catch (error) {
    const descriptor = describeProxyError(error);

    logTransportRequest({
      requestId,
      method: 'GET',
      path: backendPath,
      destination: 'backend',
      durationMs: Date.now() - startedAt,
      status: descriptor.status,
      retryCount: observedRetryCount ?? PUBLIC_READ_RETRY_POLICY.attempts - 1,
      authMode: 'public',
      transportErrorCode: descriptor.code,
      source: 'public-proxy',
    });

    return createProxyErrorResponse({ descriptor, requestId, request });
  }
}
