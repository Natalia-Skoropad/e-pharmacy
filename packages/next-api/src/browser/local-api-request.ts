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

import { logApiRequest } from '../observability/request-logger';

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
  }: RequestOptions = {}
): Promise<TData> {
  const requestHeaders = new Headers(headers);
  const requestBody = prepareRequestBody(body, requestHeaders);
  const retryConfig = getRetryConfig(method, retry);
  const startedAt = Date.now();
  let response: Response;

  for (let attempt = 1; ; attempt += 1) {
    try {
      response = await fetch(path, {
        method,
        headers: requestHeaders,
        body: requestBody,
        cache,
        signal: getRequestSignal(signal, timeoutMs),
        credentials,
      });
    } catch (error) {
      if (attempt < retryConfig.attempts && !signal) {
        await wait(retryConfig.delayMs);
        continue;
      }

      const transportError = toTransportError(error, { url: path, method });

      logApiRequest({
        method,
        path,
        destination: 'bff',
        durationMs: Date.now() - startedAt,
        status: transportError.status,
        cache,
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

    await wait(retryConfig.delayMs);
  }

  const payload = await parseJsonSafe<TData>(response);
  logApiRequest({
    method,
    path,
    destination: 'bff',
    durationMs: Date.now() - startedAt,
    status: response.status,
    cache,
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
  return payload as TData;
}
