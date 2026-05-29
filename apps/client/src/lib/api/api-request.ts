import { ApiError } from './api-error';
import { createApiUrl } from './api-url';
import { getApiErrorMessage } from './get-api-error-message';
import { parseJsonSafe } from './parse-json-safe';
import { prepareRequestBody } from './request-body';
import type { ApiRequestConfig } from './types';

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
    signal,
  });

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
