import { ApiError } from './api-error';
import type { ApiRetryConfig, HttpMethod, RequestOptions } from './types';

//===================================================================

export const DEFAULT_API_REQUEST_TIMEOUT_MS = 12_000;
export const DEFAULT_RETRY_DELAY_MS = 250;
export const DEFAULT_RETRYABLE_GET_STATUSES = [502, 503, 504] as const;

//===================================================================

export type OperationSignal = Readonly<{
  signal: AbortSignal;
  didTimeout: () => boolean;
  cleanup: () => void;
}>;

//===================================================================

function assertFiniteNonNegative(value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new TypeError(
      `${label} must be a finite number greater than or equal to 0.`
    );
  }
}

//===================================================================

export function createOperationSignal(
  externalSignal: AbortSignal | undefined,
  timeoutMs = DEFAULT_API_REQUEST_TIMEOUT_MS
): OperationSignal {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw new TypeError('timeoutMs must be a finite number greater than 0.');
  }

  const controller = new AbortController();
  let timedOut = false;

  const abortFromExternalSignal = (): void => {
    controller.abort(externalSignal?.reason);
  };

  if (externalSignal?.aborted) {
    abortFromExternalSignal();
  } else {
    externalSignal?.addEventListener('abort', abortFromExternalSignal, {
      once: true,
    });
  }

  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort(
      new DOMException('The operation timed out.', 'TimeoutError')
    );
  }, timeoutMs);

  return {
    signal: controller.signal,
    didTimeout: () => timedOut,
    cleanup: () => {
      clearTimeout(timeoutId);
      externalSignal?.removeEventListener('abort', abortFromExternalSignal);
    },
  };
}

//===================================================================

export function getRetryConfig(
  method: HttpMethod,
  retry: RequestOptions['retry']
): Required<ApiRetryConfig> {
  if (retry === false || method !== 'GET') {
    return { attempts: 1, statuses: [], delayMs: 0 };
  }

  const attempts = retry?.attempts ?? 2;
  const statuses = retry?.statuses ?? DEFAULT_RETRYABLE_GET_STATUSES;
  const delayMs = retry?.delayMs ?? DEFAULT_RETRY_DELAY_MS;

  if (!Number.isInteger(attempts) || attempts < 1) {
    throw new TypeError(
      'retry.attempts must be an integer greater than or equal to 1.'
    );
  }

  assertFiniteNonNegative(delayMs, 'retry.delayMs');

  const validatedStatuses = [...statuses];
  for (const status of validatedStatuses) {
    if (!Number.isInteger(status) || status < 100 || status > 599) {
      throw new TypeError(
        'retry.statuses must contain valid HTTP status codes.'
      );
    }
  }

  return {
    attempts,
    statuses: validatedStatuses,
    delayMs,
  };
}

//===================================================================

function createAbortError(signal: AbortSignal): unknown {
  if (signal.reason !== undefined) return signal.reason;
  return new DOMException('The operation was aborted.', 'AbortError');
}

export function wait(ms: number, signal?: AbortSignal): Promise<void> {
  assertFiniteNonNegative(ms, 'Delay');

  if (signal?.aborted) return Promise.reject(createAbortError(signal!));
  if (ms === 0) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);

    const onAbort = (): void => {
      clearTimeout(timeoutId);
      signal?.removeEventListener('abort', onAbort);
      reject(createAbortError(signal!));
    };

    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

//===================================================================

function hasErrorName(error: unknown, name: string): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    (error as { name?: unknown }).name === name
  );
}

export function toTransportError(
  error: unknown,
  context: Readonly<{
    url: string;
    method: string;
    externalSignal?: AbortSignal;
    timedOut?: boolean;
  }>
): ApiError {
  if (context.timedOut || hasErrorName(error, 'TimeoutError')) {
    return new ApiError('The service did not respond in time.', {
      transportCode: 'TIMEOUT',
      url: context.url,
      method: context.method,
      cause: error,
    });
  }

  if (context.externalSignal?.aborted || hasErrorName(error, 'AbortError')) {
    return new ApiError('The request was cancelled.', {
      transportCode: 'ABORTED',
      url: context.url,
      method: context.method,
      cause: error,
    });
  }

  return new ApiError('Unable to reach the service.', {
    transportCode: 'NETWORK_ERROR',
    url: context.url,
    method: context.method,
    cause: error,
  });
}
