export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

//===================================================================

export type JsonRequestBody =
  | Readonly<Record<string, unknown>>
  | readonly unknown[];

export type TextRequestBody = string | URLSearchParams;

export type ApiRequestBody = JsonRequestBody | TextRequestBody;

//===================================================================

export type ApiRetryConfig = Readonly<{
  attempts?: number;
  statuses?: readonly number[];
  delayMs?: number;
}>;

//===================================================================

export type RequestOptions = {
  method?: HttpMethod;
  body?: ApiRequestBody;
  headers?: HeadersInit;
  cache?: RequestCache;
  credentials?: RequestCredentials;
  signal?: AbortSignal;
  timeoutMs?: number;
  retry?: false | ApiRetryConfig;
  redirect?: RequestRedirect;
  responseType?: 'json' | 'no-content';
};

export type ApiRequestOptions = RequestOptions & {
  baseUrl: string;
};

//===================================================================

export type JsonResponseRequestOptions = Omit<
  RequestOptions,
  'responseType'
> & {
  responseType?: 'json';
};

export type ApiJsonResponseRequestOptions = JsonResponseRequestOptions & {
  baseUrl: string;
};

//===================================================================

export type NoContentResponseRequestOptions = Omit<
  RequestOptions,
  'responseType'
> & {
  responseType: 'no-content';
};

export type ApiNoContentResponseRequestOptions =
  NoContentResponseRequestOptions & {
    baseUrl: string;
  };

//===================================================================

export type ApiClientConfig = Readonly<{
  baseUrl: string;
  defaults?: Omit<RequestOptions, 'body' | 'signal' | 'responseType'>;
}>;
