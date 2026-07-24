import { ApiError } from './api-error';
import { createApiUrl } from './api-url';
import { getApiErrorMessage } from './get-api-error-message';
import { parseJsonSafe } from './parse-json-safe';
import { prepareRequestBody } from './request-body';

import {
  DEFAULT_API_REQUEST_TIMEOUT_MS,
  getRequestSignal,
  getRetryConfig,
  toTransportError,
  wait,
} from './request-utils';

import type { RequestOptions } from './types';

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
    redirect = 'follow',
  }: RequestOptions = {}
): Promise<TData> {
  const url = createApiUrl(path, baseUrl ?? '');
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
        redirect,
        signal: getRequestSignal(signal, timeoutMs),
      } as RequestInit & { next?: RequestOptions['next'] });
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
