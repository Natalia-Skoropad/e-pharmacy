import {
  ApiError,
  getApiErrorMessage,
  parseJsonSafe,
  prepareRequestBody,
  type ApiRequestConfig,
} from '@e-pharmacy/api-client/core';

//===================================================================

const DEFAULT_TIMEOUT_MS = 12_000;

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
  }: ApiRequestConfig = {}
): Promise<TData> {
  const requestHeaders = new Headers(headers);
  const requestBody = prepareRequestBody(body, requestHeaders);
  let response: Response;

  try {
    response = await fetch(path, {
      method,
      headers: requestHeaders,
      body: requestBody,
      cache,
      signal: signal ?? AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
      credentials,
    });
  } catch (error) {
    if (
      error instanceof DOMException &&
      (error.name === 'AbortError' || error.name === 'TimeoutError')
    ) {
      throw new ApiError('The service did not respond in time.', 408, null, {
        url: path,
        method,
      });
    }
    throw new ApiError('Unable to reach the service.', 0, null, {
      url: path,
      method,
    });
  }

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
