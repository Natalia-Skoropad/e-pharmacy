export type ApiTransportErrorCode =
  | 'TIMEOUT'
  | 'ABORTED'
  | 'NETWORK_ERROR'
  | 'INVALID_RESPONSE'
  | 'INVALID_REQUEST_BODY';

//===================================================================

export type ApiErrorCode = ApiTransportErrorCode | 'HTTP_ERROR';

//===================================================================

const API_ERROR_TAG = Symbol.for('@e-pharmacy/api-client/ApiError');

//===================================================================

export type ApiErrorOptions = Readonly<{
  transportCode?: ApiTransportErrorCode;
  httpStatus?: number;
  backendCode?: string;
  requestId?: string;
  retryAfterSeconds?: number;
  details?: unknown;
  url?: string;
  method?: string;
  payload?: unknown;
  cause?: unknown;
}>;

type LegacyApiErrorMeta = Readonly<{
  url?: string;
  method?: string;
  code?: ApiErrorCode;
  cause?: unknown;
}>;

//===================================================================

export class ApiError extends Error {
  readonly [API_ERROR_TAG] = true;
  readonly transportCode?: ApiTransportErrorCode;
  readonly httpStatus?: number;
  readonly backendCode?: string;
  readonly requestId?: string;
  readonly retryAfterSeconds?: number;
  readonly details?: unknown;
  readonly url?: string;
  readonly method?: string;
  readonly payload?: unknown;
  override readonly cause?: unknown;

  /** @deprecated Prefer httpStatus. Transport failures intentionally use 0. */
  readonly status: number;

  /** @deprecated Prefer transportCode and backendCode. */
  readonly code: ApiErrorCode | string;

  constructor(message: string, options?: ApiErrorOptions);

  constructor(
    message: string,
    status?: number,
    payload?: unknown,
    meta?: LegacyApiErrorMeta
  );

  constructor(
    message: string,
    optionsOrStatus: ApiErrorOptions | number = {},
    legacyPayload?: unknown,
    legacyMeta?: LegacyApiErrorMeta
  ) {
    const options: ApiErrorOptions =
      typeof optionsOrStatus === 'number'
        ? {
            ...(optionsOrStatus > 0 ? { httpStatus: optionsOrStatus } : {}),
            payload: legacyPayload,
            url: legacyMeta?.url,
            method: legacyMeta?.method,
            cause: legacyMeta?.cause,
            ...(legacyMeta?.code && legacyMeta.code !== 'HTTP_ERROR'
              ? { transportCode: legacyMeta.code }
              : {}),
          }
        : optionsOrStatus;

    super(
      message,
      options.cause === undefined ? undefined : { cause: options.cause }
    );

    this.name = 'ApiError';
    this.transportCode = options.transportCode;
    this.httpStatus = options.httpStatus;
    this.backendCode = options.backendCode;
    this.requestId = options.requestId;
    this.retryAfterSeconds = options.retryAfterSeconds;
    this.details = options.details;
    this.url = options.url;
    this.method = options.method;
    this.payload = options.payload;
    this.cause = options.cause;
    this.status = options.httpStatus ?? 0;
    this.code = options.transportCode ?? options.backendCode ?? 'HTTP_ERROR';

    Object.setPrototypeOf(this, new.target.prototype);
  }
}

//===================================================================

export function isApiError(error: unknown): error is ApiError {
  if (error instanceof ApiError) return true;
  if (!error || typeof error !== 'object') return false;

  const candidate = error as Partial<ApiError> & {
    [API_ERROR_TAG]?: unknown;
  };

  return (
    candidate[API_ERROR_TAG] === true &&
    candidate.name === 'ApiError' &&
    typeof candidate.message === 'string'
  );
}
