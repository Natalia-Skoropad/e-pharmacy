import { ApiError } from './api-error';
import type { ApiRetryConfig, HttpMethod, RequestOptions } from './types';

//===================================================================

export const DEFAULT_API_REQUEST_TIMEOUT_MS = 12_000;
export const DEFAULT_RETRY_DELAY_MS = 250;
export const DEFAULT_RETRYABLE_GET_STATUSES = [502, 503, 504];

//===================================================================

export function getRequestSignal(
  signal?: AbortSignal,
  timeoutMs = DEFAULT_API_REQUEST_TIMEOUT_MS
): AbortSignal {
  return signal ?? AbortSignal.timeout(timeoutMs);
}

//===================================================================

export function getRetryConfig(
  method: HttpMethod,
  retry: RequestOptions['retry']
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

export function wait(ms: number): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, ms));
}

//===================================================================

export function toTransportError(
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
