import {
  ApiError,
  getApiErrorMessage,
  parseJsonSafe,
  prepareRequestBody,
  type ApiRequestConfig,
  type ApiRetryConfig,
  type HttpMethod,
} from '@e-pharmacy/api-client/core';

import { logApiRequest } from '@/lib/api/observability/request-logger';

//===================================================================

const DEFAULT_TIMEOUT_MS = 12_000;
const DEFAULT_RETRY_DELAY_MS = 250;
const DEFAULT_RETRYABLE_GET_STATUSES = [502, 503, 504];

//===================================================================

function getRetryConfig(
  method: HttpMethod,
  retry: ApiRequestConfig['retry']
): Required<ApiRetryConfig> {
  if (retry === false || method !== 'GET') {
    return { attempts: 1, statuses: [], delayMs: 0 };
  }

  return {
    attempts: retry?.attempts ?? 2,
    statuses: retry?.statuses ?? DEFAULT_RETRYABLE_GET_STATUSES,
    delayMs: retry?.delayMs ?? DEFAULT_RETRY_DELAY_MS,
  };
}

//===================================================================

function wait(ms: number): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

//===================================================================

function toTransportError(
  error: unknown,
  context: { url: string; method: string }
): ApiError {
  if (error instanceof DOMException && error.name === 'TimeoutError') {
    return new ApiError('The service did not respond in time.', 408, null, {
      ...context,
      code: 'TIMEOUT',
    });
  }

  if (error instanceof DOMException && error.name === 'AbortError') {
    return new ApiError('The request was cancelled.', 499, null, {
      ...context,
      code: 'ABORTED',
    });
  }

  return new ApiError('Unable to reach the service.', 0, null, {
    ...context,
    code: 'NETWORK_ERROR',
  });
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
    timeoutMs = DEFAULT_TIMEOUT_MS,
    retry,
  }: ApiRequestConfig = {}
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
        signal: signal ?? AbortSignal.timeout(timeoutMs),
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
