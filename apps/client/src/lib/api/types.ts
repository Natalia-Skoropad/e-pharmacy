export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

//===================================================================

export type ApiRequestBody = BodyInit | Record<string, unknown> | unknown;

//===================================================================

export type ApiRequestConfig = {
  method?: HttpMethod;
  body?: ApiRequestBody;
  headers?: HeadersInit;
  cache?: RequestCache;
  next?: NextFetchRequestConfig;
  credentials?: RequestCredentials;
  signal?: AbortSignal;
  baseUrl?: string;
};

//===================================================================

export type RequestOptions = ApiRequestConfig;
