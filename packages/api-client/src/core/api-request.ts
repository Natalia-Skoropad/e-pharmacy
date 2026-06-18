import { ApiError } from './api-error';
import { createApiUrl } from './api-url';
import { getApiErrorMessage } from './get-api-error-message';
import { parseJsonSafe } from './parse-json-safe';
import { prepareRequestBody } from './request-body';
import type { ApiRequestConfig, ApiRetryConfig, HttpMethod } from './types';

//===================================================================

const DEFAULT_API_REQUEST_TIMEOUT_MS = 12_000;
const DEFAULT_RETRY_DELAY_MS = 250;
const DEFAULT_RETRYABLE_GET_STATUSES = [502, 503, 504];

//===================================================================

function getRequestSignal(
  signal?: AbortSignal,
  timeoutMs = DEFAULT_API_REQUEST_TIMEOUT_MS
): AbortSignal {
  return signal ?? AbortSignal.timeout(timeoutMs);
}

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
  return new Promise((resolve) => setTimeout(resolve, ms));
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

export async function apiRequest<TData>(
  path: string,
  {
    method = 'GET',
    body,
    headers,
    cache = 'no-store',
    next,
    credentials = 'include',
    signal,
    baseUrl,
    timeoutMs = DEFAULT_API_REQUEST_TIMEOUT_MS,
    retry,
  }: ApiRequestConfig = {}
): Promise<TData> {
  const url = createApiUrl(path, baseUrl);
  const requestHeaders = new Headers(headers);
  const requestBody = prepareRequestBody(body, requestHeaders);
  const retryConfig = getRetryConfig(method, retry);

  let response: Response;

  for (let attempt = 1; ; attempt += 1) {
    try {
      response = await fetch(url, {
        method,
        headers: requestHeaders,
        body: requestBody,
        cache,
        next,
        credentials,
        signal: getRequestSignal(signal, timeoutMs),
      } as RequestInit & { next?: ApiRequestConfig['next'] });
    } catch (error) {
      if (attempt < retryConfig.attempts && !signal) {
        await wait(retryConfig.delayMs);
        continue;
      }

      throw toTransportError(error, { url, method });
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

  if (!response.ok) {
    throw new ApiError(
      getApiErrorMessage(payload, response.statusText),
      response.status,
      payload,
      { url, method, code: 'HTTP_ERROR' }
    );
  }

  return payload as TData;
}
