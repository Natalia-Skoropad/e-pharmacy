import type { ApiErrorCode } from './api-error';

//===================================================================

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

//===================================================================

export type ApiRequestBody = BodyInit | Record<string, unknown> | unknown;

//===================================================================

export type NextRequestOptions = {
  revalidate?: number | false;
  tags?: string[];
};

//===================================================================

export type ApiRetryConfig = {
  attempts?: number;
  statuses?: number[];
  delayMs?: number;
};

//===================================================================

export type ApiRequestConfig = {
  method?: HttpMethod;
  body?: ApiRequestBody;
  headers?: HeadersInit;
  cache?: RequestCache;
  next?: NextRequestOptions;
  credentials?: RequestCredentials;
  signal?: AbortSignal;
  baseUrl?: string;
  timeoutMs?: number;
  retry?: false | ApiRetryConfig;
};

//===================================================================

export type RequestOptions = ApiRequestConfig;
export type { ApiErrorCode };
