import { createApiUrl, InvalidApiBaseUrlError } from './api-url';
import { executeHttpRequest } from './request-executor';

import type {
  ApiBlobResponseRequestOptions,
  ApiClientConfig,
  ApiJsonResponseRequestOptions,
  ApiNoContentResponseRequestOptions,
  BlobResponseRequestOptions,
  JsonResponseRequestOptions,
  NoContentResponseRequestOptions,
  RequestOptions,
} from './types';

//===================================================================

export function apiRequest(
  path: string,
  options: ApiNoContentResponseRequestOptions
): Promise<void>;

//===================================================================

export function apiRequest(
  path: string,
  options: ApiBlobResponseRequestOptions
): Promise<Blob>;

//===================================================================

export function apiRequest(
  path: string,
  options: ApiJsonResponseRequestOptions
): Promise<unknown>;

//===================================================================

export async function apiRequest(
  path: string,
  requestOptions?:
    | ApiBlobResponseRequestOptions
    | ApiJsonResponseRequestOptions
    | ApiNoContentResponseRequestOptions
): Promise<unknown> {
  if (!requestOptions) {
    throw new InvalidApiBaseUrlError(
      'apiRequest requires a configured baseUrl. Use createApiClient or pass baseUrl explicitly.'
    );
  }

  const { baseUrl, ...options } = requestOptions;
  const url = createApiUrl(path, baseUrl);

  const result = await executeHttpRequest(url, {
    ...options,
    redirect: options.redirect ?? 'manual',
  });
  return result.data;
}

//===================================================================

export type ApiClient = Readonly<{
  request(
    path: string,
    options: NoContentResponseRequestOptions
  ): Promise<void>;

  request(path: string, options: BlobResponseRequestOptions): Promise<Blob>;

  request(path: string, options?: JsonResponseRequestOptions): Promise<unknown>;
}>;

//===================================================================

function mergeHeaders(
  defaults: HeadersInit | undefined,
  overrides: HeadersInit | undefined
): Headers {
  const headers = new Headers(defaults);
  new Headers(overrides).forEach((value, key) => headers.set(key, value));
  return headers;
}

//===================================================================

export function createApiClient({
  baseUrl,
  defaults = {},
}: ApiClientConfig): ApiClient {
  createApiUrl('/', baseUrl);

  const request = async (
    path: string,
    options: RequestOptions = {}
  ): Promise<unknown> => {
    const mergedOptions: RequestOptions = {
      ...defaults,
      ...options,
      headers: mergeHeaders(defaults.headers, options.headers),
      redirect: options.redirect ?? defaults.redirect ?? 'manual',
    };

    const url = createApiUrl(path, baseUrl);
    const result = await executeHttpRequest(url, mergedOptions);
    return result.data;
  };

  return { request } as ApiClient;
}
