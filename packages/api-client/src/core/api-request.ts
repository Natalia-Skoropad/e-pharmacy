import { ApiError } from './api-error';
import { createApiUrl } from './api-url';
import { getApiErrorMessage } from './get-api-error-message';
import { parseJsonSafe } from './parse-json-safe';
import { prepareRequestBody } from './request-body';
import type { ApiRequestConfig } from './types';

//===================================================================

const DEFAULT_API_REQUEST_TIMEOUT_MS = 12_000;

//===================================================================

function getRequestSignal(signal?: AbortSignal): AbortSignal {
  return signal ?? AbortSignal.timeout(DEFAULT_API_REQUEST_TIMEOUT_MS);
}

//===================================================================

function toTransportError(
  error: unknown,
  context: { url: string; method: string }
): ApiError {
  if (
    error instanceof DOMException &&
    (error.name === 'AbortError' || error.name === 'TimeoutError')
  ) {
    return new ApiError(
      'The service did not respond in time.',
      408,
      null,
      context
    );
  }

  return new ApiError('Unable to reach the service.', 0, null, context);
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
  }: ApiRequestConfig = {}
): Promise<TData> {
  const url = createApiUrl(path, baseUrl);
  const requestHeaders = new Headers(headers);
  const requestBody = prepareRequestBody(body, requestHeaders);

  let response: Response;
  const retryableStatuses = new Set([502, 503, 504]);
  const maxAttempts = method === 'GET' ? 2 : 1;

  for (let attempt = 1; ; attempt += 1) {
    try {
      response = await fetch(url, {
        method,
        headers: requestHeaders,
        body: requestBody,
        cache,
        next,
        credentials,
        signal: getRequestSignal(signal),
      } as RequestInit & { next?: ApiRequestConfig['next'] });
    } catch (error) {
      if (attempt < maxAttempts && !signal) continue;
      throw toTransportError(error, { url, method });
    }

    if (attempt >= maxAttempts || !retryableStatuses.has(response.status)) {
      break;
    }
  }

  const payload = await parseJsonSafe<TData>(response);

  if (!response.ok) {
    throw new ApiError(
      getApiErrorMessage(payload, response.statusText),
      response.status,
      payload,
      { url, method }
    );
  }

  return payload as TData;
}
