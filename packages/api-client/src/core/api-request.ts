import { ApiError } from './api-error';
import { createApiUrl } from './api-url';
import { getApiErrorMessage } from './get-api-error-message';
import { parseJsonSafe } from './parse-json-safe';
import { prepareRequestBody } from './request-body';
import type { ApiRequestConfig } from './types';

//===================================================================

const DEFAULT_API_REQUEST_TIMEOUT_MS = 10_000;

function getRequestSignal(signal?: AbortSignal): AbortSignal {
  return signal ?? AbortSignal.timeout(DEFAULT_API_REQUEST_TIMEOUT_MS);
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

  const response = await fetch(url, {
    method,
    headers: requestHeaders,
    body: requestBody,
    cache,
    next,
    credentials,
    signal: getRequestSignal(signal),
  } as RequestInit & { next?: ApiRequestConfig['next'] });

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
