import { ApiError } from './api-error';
import { getApiErrorMessage } from './get-api-error-message';
import { parseJsonSafe } from './parse-json-safe';
import { prepareRequestBody } from './request-body';
import type { ApiRequestConfig } from './types';

//===================================================================

/**
 * Same-origin request helper for Next.js route handlers under `/api/*`.
 * Use it from client components/services when the request must go through
 * the client app BFF layer instead of calling the backend directly.
 */
export async function localApiRequest<TData>(
  path: string,
  {
    method = 'GET',
    body,
    headers,
    cache = 'no-store',
    signal,
    credentials = 'same-origin',
  }: ApiRequestConfig = {}
): Promise<TData> {
  const requestHeaders = new Headers(headers);
  const requestBody = prepareRequestBody(body, requestHeaders);

  const response = await fetch(path, {
    method,
    headers: requestHeaders,
    body: requestBody,
    cache,
    signal,
    credentials,
  });

  const payload = await parseJsonSafe<TData>(response);

  if (!response.ok) {
    throw new ApiError(
      getApiErrorMessage(payload, response.statusText),
      response.status,
      payload,
      { url: path, method }
    );
  }

  return payload as TData;
}
