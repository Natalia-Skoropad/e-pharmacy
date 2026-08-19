import 'server-only';
import { headers as getRequestHeaders } from 'next/headers';

import {
  ApiError,
  executeHttpRequest,
  type RequestOptions,
} from '@e-pharmacy/api-client/transport';

import { createTrustedBackendApiUrl } from '../internal/backend-url';
import { createAllowedAuthCookieHeader } from '../internal/cookie-header';
import { applyServerCorrelationHeaders } from '../internal/trace-context';
import { createRequestId } from '../internal/request-id';

import {
  NEXT_API_TIMEOUTS_MS,
  PUBLIC_READ_RETRY_POLICY,
} from '../internal/transport-policy';

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

export type AuthenticatedBackendReadOptions = Omit<
  RequestOptions,
  'method' | 'body' | 'cache' | 'credentials' | 'responseType'
>;

export const PUBLIC_BACKEND_READ_TRANSPORT_OPTIONS = {
  timeoutMs: NEXT_API_TIMEOUTS_MS.publicRead,
  retry: PUBLIC_READ_RETRY_POLICY,
} as const satisfies Pick<RequestOptions, 'timeoutMs' | 'retry'>;

//===================================================================

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
  const isCacheable =
    next?.revalidate !== undefined && resolvedCache !== 'no-store';

  applyServerCorrelationHeaders(requestHeaders, requestId, isCacheable);

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

//===================================================================

export async function authenticatedBackendApiRequest(
  path: string,
  options: AuthenticatedBackendReadOptions = {}
): Promise<unknown> {
  const requestId = createRequestId();
  const startedAt = Date.now();
  const url = createTrustedBackendApiUrl(path);
  const incomingHeaders = await getRequestHeaders();

  const authCookieHeader = createAllowedAuthCookieHeader(
    incomingHeaders.get('cookie'),
    'access-only'
  );

  const requestHeaders = new Headers(options.headers);
  requestHeaders.delete('Cookie');
  if (authCookieHeader) requestHeaders.set('Cookie', authCookieHeader);

  // Private RSC reads are always fail-closed and never cached. Cookie presence
  // is not treated as authentication: the backend authenticate middleware must
  // validate the JWT, active Session, current User and role/ownership policy.
  applyServerCorrelationHeaders(requestHeaders, requestId, false);

  try {
    const result = await executeHttpRequest(url, {
      ...options,
      method: 'GET',
      headers: requestHeaders,
      cache: 'no-store',
      credentials: 'omit',
      redirect: 'manual',
    });

    logTransportRequest({
      requestId,
      method: 'GET',
      path,
      destination: 'backend',
      durationMs: Date.now() - startedAt,
      status: result.status,
      retryCount: result.retryCount,
      cachePolicy: 'no-store',
      authMode: 'private',
      source: 'server-private-api',
    });

    return result.data;
  } catch (error) {
    logTransportRequest({
      requestId,
      method: 'GET',
      path,
      destination: 'backend',
      durationMs: Date.now() - startedAt,
      status: error instanceof ApiError ? error.httpStatus : undefined,
      cachePolicy: 'no-store',
      authMode: 'private',
      transportErrorCode:
        error instanceof ApiError ? error.transportCode : undefined,
      source: 'server-private-api',
    });

    throw error;
  }
}
