import {
  executeHttpRequest,
  isApiError,
  type BlobResponseRequestOptions,
  type JsonResponseRequestOptions,
  type NoContentResponseRequestOptions,
  type RequestOptions,
} from '@e-pharmacy/api-client/transport';

import {
  BFF_CSRF_HEADER_NAME,
  BFF_CSRF_HEADER_VALUE,
} from '../internal/bff-contract';

import { createRequestId } from '../internal/request-id';
import { createTraceparent } from '../internal/trace-context';
import { logTransportRequest } from '../observability/logger';
import { assertLocalApiPath } from './local-api-path';

//===================================================================

function isMutationMethod(method: string): boolean {
  return method !== 'GET';
}

//===================================================================

export function localApiRequest(
  path: string,
  options: NoContentResponseRequestOptions
): Promise<void>;

//===================================================================

export function localApiRequest(
  path: string,
  options: BlobResponseRequestOptions
): Promise<Blob>;

//===================================================================

export function localApiRequest(
  path: string,
  options?: JsonResponseRequestOptions
): Promise<unknown>;

//===================================================================

export async function localApiRequest(
  path: string,
  {
    method = 'GET',
    headers,
    cache = 'no-store',
    credentials = 'same-origin',
    redirect = 'manual',
    retry = false,
    ...options
  }: RequestOptions = {}
): Promise<unknown> {
  assertLocalApiPath(path);

  const requestId = createRequestId();
  const requestHeaders = new Headers(headers);
  const startedAt = Date.now();

  if (!requestHeaders.has('traceparent')) {
    const traceparent = createTraceparent(requestId);
    if (traceparent) requestHeaders.set('traceparent', traceparent);
  }

  if (isMutationMethod(method)) {
    requestHeaders.set(BFF_CSRF_HEADER_NAME, BFF_CSRF_HEADER_VALUE);
  }

  try {
    const result = await executeHttpRequest(path, {
      ...options,
      method,
      headers: requestHeaders,
      cache,
      credentials,
      redirect,
      retry,
    });

    logTransportRequest({
      requestId,
      method,
      path,
      destination: 'bff',
      durationMs: Date.now() - startedAt,
      status: result.status,
      retryCount: result.retryCount,
      cachePolicy: cache,
      authMode: 'private',
      source: 'browser-api',
    });

    return result.data;
  } catch (error) {
    logTransportRequest({
      requestId,
      method,
      path,
      destination: 'bff',
      durationMs: Date.now() - startedAt,
      status: isApiError(error) ? error.httpStatus : undefined,
      retryCount: 0,
      cachePolicy: cache,
      authMode: 'private',
      transportErrorCode: isApiError(error) ? error.transportCode : undefined,
      source: 'browser-api',
    });

    throw error;
  }
}
