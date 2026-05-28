export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

//===================================================================

export type RequestOptions = {
  method?: HttpMethod;
  body?: unknown;
  headers?: HeadersInit;
  cache?: RequestCache;
  next?: NextFetchRequestConfig;
};

export type ApiRequestConfig = RequestOptions & {
  /**
   * Cookie-auth session marker. It is not a JWT and is only used to express
   * that the request belongs to an authenticated UI flow. Browser cookies are
   * still the real credential via credentials: 'include'.
   */
  authSession?: string;

  /** @deprecated Use authSession for cookie-based auth flows. */
  authToken?: string;
};
