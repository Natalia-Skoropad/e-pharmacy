import 'client-only';

import {
  ApiError,
  DEFAULT_API_REQUEST_TIMEOUT_MS,
  getApiErrorMessage,
  getRequestSignal,
  getRetryConfig,
  parseJsonSafe,
  prepareRequestBody,
  toTransportError,
  wait,
  type RequestOptions,
} from '@e-pharmacy/api-client/core';

import {
  BFF_CSRF_HEADER_NAME,
  BFF_CSRF_HEADER_VALUE,
} from '../internal/bff-contract';

import { createRequestId } from '../internal/request-id';
import { logTransportRequest } from '../observability/logger';
import { assertLocalApiPath } from './local-api-path';

//===================================================================

function isMutationMethod(method: string): boolean {
  return method !== 'GET';
}

//===================================================================

export async function localApiRequest<TData>(
  path: string,
  {
    method = 'GET',
    body,
    headers,
    cache = 'no-store',
    signal,
    credentials = 'same-origin',
    timeoutMs = DEFAULT_API_REQUEST_TIMEOUT_MS,
    retry,
    redirect = 'manual',
  }: RequestOptions = {}
): Promise<TData> {
  assertLocalApiPath(path);

  const requestId = createRequestId();
  const requestHeaders = new Headers(headers);

  if (isMutationMethod(method)) {
    requestHeaders.set(BFF_CSRF_HEADER_NAME, BFF_CSRF_HEADER_VALUE);
  }

  const requestBody = prepareRequestBody(body, requestHeaders);
  const retryConfig = getRetryConfig(method, retry);
  const startedAt = Date.now();
  let response: Response;
  let retryCount = 0;

  for (let attempt = 1; ; attempt += 1) {
    try {
      response = await fetch(path, {
        method,
        headers: requestHeaders,
        body: requestBody,
        cache,
        redirect,
        signal: getRequestSignal(signal, timeoutMs),
        credentials,
      });
    } catch (error) {
      if (attempt < retryConfig.attempts && !signal) {
        retryCount += 1;
        await wait(retryConfig.delayMs);
        continue;
      }

      const transportError = toTransportError(error, { url: path, method });

      logTransportRequest({
        requestId,
        method,
        path,
        destination: 'bff',
        durationMs: Date.now() - startedAt,
        status: transportError.status,
        retryCount,
        cachePolicy: cache,
        authMode: 'private',
        transportErrorCode: transportError.code,
        source: 'browser-api',
      });

      throw transportError;
    }

    if (
      attempt >= retryConfig.attempts ||
      !retryConfig.statuses.includes(response.status)
    ) {
      break;
    }

    retryCount += 1;
    await wait(retryConfig.delayMs);
  }

  if (response.status === 204) {
    logTransportRequest({
      requestId,
      method,
      path,
      destination: 'bff',
      durationMs: Date.now() - startedAt,
      status: response.status,
      retryCount,
      cachePolicy: cache,
      authMode: 'private',
      source: 'browser-api',
    });

    return undefined as TData;
  }

  const contentType = response.headers.get('content-type') ?? '';
  const isJson = /(^|\/)json(?:;|$)|\+json(?:;|$)/i.test(contentType);
  const payload = isJson ? await parseJsonSafe<TData>(response) : null;

  logTransportRequest({
    requestId,
    method,
    path,
    destination: 'bff',
    durationMs: Date.now() - startedAt,
    status: response.status,
    retryCount,
    cachePolicy: cache,
    authMode: 'private',
    source: 'browser-api',
  });

  if (!response.ok) {
    throw new ApiError(
      getApiErrorMessage(payload, response.statusText),
      response.status,
      payload,
      { url: path, method, code: 'HTTP_ERROR' }
    );
  }

  if (!isJson || payload === null) {
    throw new ApiError(
      'The API returned an invalid JSON response.',
      502,
      null,
      { url: path, method, code: 'INVALID_RESPONSE' }
    );
  }

  return payload;
}
