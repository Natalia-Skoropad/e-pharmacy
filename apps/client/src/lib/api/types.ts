export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

//===================================================================

export type QueryPrimitive = string | number | boolean | null | undefined;

export type QueryParams = Record<string, QueryPrimitive | QueryPrimitive[]>;

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

export type ApiRequestOptions = ApiRequestConfig;

//===================================================================

export type ApiResponse<TData = unknown> = {
  status?: 'success' | 'error' | 'fail';
  message?: string;
  data?: TData;
  total?: number;
  page?: number;
  perPage?: number;
};

//===================================================================

export type ApiErrorPayload = {
  status?: 'error' | 'fail';
  message?: string | string[];
  error?: string;
  details?: unknown;
};
