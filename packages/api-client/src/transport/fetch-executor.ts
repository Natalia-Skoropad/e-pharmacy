import { isApiError } from './api-error';

import {
  createOperationSignal,
  getRetryConfig,
  toTransportError,
  wait,
  DEFAULT_API_REQUEST_TIMEOUT_MS,
} from './request-utils';

import type { HttpMethod, RequestOptions } from './types';

//===================================================================

export type FetchExecutionResult = Readonly<{
  response: Response;
  retryCount: number;
  signal: AbortSignal;
  cleanup: () => void;
}>;

export type FetchExecutorOptions = Readonly<{
  method: HttpMethod;
  init: Omit<RequestInit, 'method' | 'signal'>;
  signal?: AbortSignal;
  timeoutMs?: number;
  retry?: RequestOptions['retry'];
  validateResponse?: (response: Response) => void | Promise<void>;
}>;

//===================================================================

async function cancelResponseBody(response: Response): Promise<void> {
  try {
    await response.body?.cancel();
  } catch {
    // Cleanup is best-effort and must not hide the request result.
  }
}

//===================================================================

export async function executeFetchWithRetry(
  url: string,
  {
    method,
    init,
    signal: externalSignal,
    timeoutMs = DEFAULT_API_REQUEST_TIMEOUT_MS,
    retry,
    validateResponse,
  }: FetchExecutorOptions
): Promise<FetchExecutionResult> {
  const retryConfig = getRetryConfig(method, retry);
  const operation = createOperationSignal(externalSignal, timeoutMs);
  let retryCount = 0;

  try {
    for (let attempt = 1; ; attempt += 1) {
      let response: Response;

      try {
        const fetchInit: RequestInit = {
          ...init,
          method,
          signal: operation.signal,
        };

        response = await fetch(url, fetchInit);
      } catch (error) {
        if (attempt < retryConfig.attempts && !operation.signal.aborted) {
          retryCount += 1;
          await wait(retryConfig.delayMs, operation.signal);
          continue;
        }

        throw toTransportError(error, {
          url,
          method,
          externalSignal,
          timedOut: operation.didTimeout(),
        });
      }

      try {
        await validateResponse?.(response);
      } catch (error) {
        if (attempt < retryConfig.attempts && !operation.signal.aborted) {
          retryCount += 1;
          await cancelResponseBody(response);
          await wait(retryConfig.delayMs, operation.signal);
          continue;
        }

        throw error;
      }

      if (
        attempt < retryConfig.attempts &&
        !operation.signal.aborted &&
        retryConfig.statuses.includes(response.status)
      ) {
        retryCount += 1;
        await cancelResponseBody(response);
        await wait(retryConfig.delayMs, operation.signal);
        continue;
      }

      return {
        response,
        retryCount,
        signal: operation.signal,
        cleanup: operation.cleanup,
      };
    }
  } catch (error) {
    operation.cleanup();

    if (isApiError(error) || !operation.signal.aborted) throw error;

    throw toTransportError(error, {
      url,
      method,
      externalSignal,
      timedOut: operation.didTimeout(),
    });
  }
}
