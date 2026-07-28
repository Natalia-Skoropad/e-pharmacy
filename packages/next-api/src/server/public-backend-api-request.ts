import 'server-only';

import {
  ApiError,
  apiRequest,
  type RequestOptions,
} from '@e-pharmacy/api-client/core';

import { createTrustedBackendApiUrl } from '../internal/backend-url';
import { getNextApiServerEnvironment } from '../internal/env';
import { REQUEST_ID_HEADER_NAME } from '../internal/bff-contract';
import { createRequestId } from '../internal/request-id';
import { logTransportRequest } from '../observability/logger';

//===================================================================

export { createTrustedBackendApiUrl } from '../internal/backend-url';

//===================================================================

type PublicBackendRequestOptions = Omit<RequestOptions, 'responseType'>;

//===================================================================

export async function publicBackendApiRequest<TData>(
  path: string,
  { method = 'GET', cache, next, ...options }: PublicBackendRequestOptions = {}
): Promise<TData> {
  const requestId = createRequestId();
  const startedAt = Date.now();
  createTrustedBackendApiUrl(path);
  const resolvedCache =
    cache ?? (next?.revalidate === undefined ? 'no-store' : undefined);
  const requestHeaders = new Headers(options.headers);
  requestHeaders.set(REQUEST_ID_HEADER_NAME, requestId);

  try {
    const data = await apiRequest<TData>(path, {
      ...options,
      baseUrl: getNextApiServerEnvironment().apiBaseUrl,
      method,
      headers: requestHeaders,
      cache: resolvedCache,
      next,
      redirect: 'manual',
    });

    logTransportRequest({
      requestId,
      method,
      path,
      destination: 'backend',
      durationMs: Date.now() - startedAt,
      cachePolicy: resolvedCache ?? `revalidate:${String(next?.revalidate)}`,
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
      status: error instanceof ApiError ? error.httpStatus : undefined,
      cachePolicy: resolvedCache ?? `revalidate:${String(next?.revalidate)}`,
      authMode: 'public',
      transportErrorCode:
        error instanceof ApiError ? error.transportCode : undefined,
      source: 'server-api',
    });

    throw error;
  }
}
