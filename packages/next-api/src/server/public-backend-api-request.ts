import 'server-only';

import {
  ApiError,
  apiRequest,
  type RequestOptions,
} from '@e-pharmacy/api-client/core';

import { createTrustedBackendApiUrl } from '../internal/backend-url';
import { createRequestId } from '../internal/request-id';
import { logTransportRequest } from '../observability/logger';

//===================================================================

export { createTrustedBackendApiUrl } from '../internal/backend-url';

//===================================================================

export async function publicBackendApiRequest<TData>(
  path: string,
  { method = 'GET', cache, ...options }: RequestOptions = {}
): Promise<TData> {
  const requestId = createRequestId();
  const startedAt = Date.now();
  const url = createTrustedBackendApiUrl(path);

  try {
    const data = await apiRequest<TData>(url, {
      ...options,
      method,
      cache,
      redirect: 'manual',
    });

    logTransportRequest({
      requestId,
      method,
      path,
      destination: 'backend',
      durationMs: Date.now() - startedAt,
      cachePolicy: cache,
      authMode: 'public',
      source: 'server-api',
    });

    return data;
  } catch (error) {
    logTransportRequest({
      requestId,
      method,
      path,
      destination: 'backend',
      durationMs: Date.now() - startedAt,
      status: error instanceof ApiError ? error.status : undefined,
      cachePolicy: cache,
      authMode: 'public',
      transportErrorCode:
        error instanceof ApiError ? error.code : undefined,
      source: 'server-api',
    });

    throw error;
  }
}
