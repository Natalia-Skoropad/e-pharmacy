import 'server-only';

import {
  ApiError,
  executeHttpRequest,
  type RequestOptions,
} from '@e-pharmacy/api-client/transport';

import { createTrustedBackendApiUrl } from '../internal/backend-url';
import { REQUEST_ID_HEADER_NAME } from '../internal/bff-contract';
import { createRequestId } from '../internal/request-id';
import { logTransportRequest } from '../observability/logger';

//===================================================================

export { createTrustedBackendApiUrl } from '../internal/backend-url';

//===================================================================

export type NextServerRequestOptions = Readonly<{
  revalidate?: number | false;
  tags?: readonly string[];
}>;

export type PublicBackendRequestOptions = Omit<
  RequestOptions,
  'responseType'
> & {
  next?: NextServerRequestOptions;
};

type NextExtendedRequestInit = RequestInit & {
  next?: {
    revalidate?: number | false;
    tags?: string[];
  };
};

//===================================================================

export async function publicBackendApiRequest(
  path: string,
  { method = 'GET', cache, next, ...options }: PublicBackendRequestOptions = {}
): Promise<unknown> {
  const requestId = createRequestId();
  const startedAt = Date.now();
  const url = createTrustedBackendApiUrl(path);

  const resolvedCache =
    cache ?? (next?.revalidate === undefined ? 'no-store' : undefined);

  const requestHeaders = new Headers(options.headers);
  requestHeaders.set(REQUEST_ID_HEADER_NAME, requestId);

  const nextFetchInit: NextExtendedRequestInit = next
    ? {
        next: {
          revalidate: next.revalidate,
          tags: next.tags ? [...next.tags] : undefined,
        },
      }
    : {};

  try {
    const result = await executeHttpRequest(
      url,
      {
        ...options,
        method,
        headers: requestHeaders,
        cache: resolvedCache,
        redirect: 'manual',
      },
      nextFetchInit
    );

    logTransportRequest({
      requestId,
      method,
      path,
      destination: 'backend',
      durationMs: Date.now() - startedAt,
      status: result.status,
      retryCount: result.retryCount,
      cachePolicy: resolvedCache ?? `revalidate:${String(next?.revalidate)}`,
      authMode: 'public',
      source: 'server-api',
    });

    return result.data;
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
