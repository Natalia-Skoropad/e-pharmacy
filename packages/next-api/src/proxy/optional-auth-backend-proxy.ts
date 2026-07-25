import type { NextRequest } from 'next/server';

import { executeBackendFetch } from '../internal/backend-fetch';
import { validateBackendJsonResponse } from '../internal/backend-response';
import { createProxyResponse } from '../internal/proxy-response';

import {
  createProxyErrorResponse,
  describeProxyError,
} from '../internal/transport-error';

import { NEXT_API_TIMEOUTS_MS } from '../internal/transport-policy';
import { logTransportRequest } from '../observability/logger';

//===================================================================

export type OptionalAuthPolicy = 'public-fallback' | 'strict';

//===================================================================

type OptionalAuthBackendProxyOptions = Readonly<{
  backendPath: string;
  request: NextRequest;
  requestId: string;
  policy: OptionalAuthPolicy;
}>;

//===================================================================

export async function proxyOptionalAuthBackendRequest({
  backendPath,
  request,
  requestId,
  policy,
}: OptionalAuthBackendProxyOptions) {
  const startedAt = Date.now();
  let response: Response;

  try {
    response = await executeBackendFetch({
      request,
      backendPath,
      method: 'GET',
      requestId,
      timeoutMs: NEXT_API_TIMEOUTS_MS.privateRequest,
      authCookieMode: 'access-only',
      forwardAccept: true,
    });

    await validateBackendJsonResponse(response);

    if (response.status === 401 && policy === 'public-fallback') {
      response = await executeBackendFetch({
        request,
        backendPath,
        method: 'GET',
        requestId,
        timeoutMs: NEXT_API_TIMEOUTS_MS.privateRequest,
        authCookieMode: 'none',
        forwardAccept: true,
      });
      await validateBackendJsonResponse(response);
    }
  } catch (error) {
    const descriptor = describeProxyError(error);
    return createProxyErrorResponse({ descriptor, requestId, request });
  }

  logTransportRequest({
    requestId,
    method: 'GET',
    path: backendPath,
    destination: 'backend',
    durationMs: Date.now() - startedAt,
    status: response.status,
    authMode: 'optional',
    source: 'optional-auth-proxy',
  });

  return createProxyResponse(response, {
    cacheControl: 'no-store',
    requestId,
  });
}
