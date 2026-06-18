export type ApiErrorCode =
  | 'TIMEOUT'
  | 'ABORTED'
  | 'NETWORK_ERROR'
  | 'INVALID_RESPONSE'
  | 'HTTP_ERROR';

//===================================================================

export class ApiError extends Error {
  status: number;
  payload: unknown;
  url?: string;
  method?: string;
  code: ApiErrorCode;

  constructor(
    message: string,
    status = 500,
    payload?: unknown,
    meta?: {
      url?: string;
      method?: string;
      code?: ApiErrorCode;
    }
  ) {
    super(message);

    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
    this.url = meta?.url;
    this.method = meta?.method;
    this.code = meta?.code ?? 'HTTP_ERROR';
  }
}

//===================================================================

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
