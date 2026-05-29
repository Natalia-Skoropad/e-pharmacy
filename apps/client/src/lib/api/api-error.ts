export class ApiError extends Error {
  status: number;
  payload: unknown;
  url?: string;
  method?: string;

  constructor(
    message: string,
    status = 500,
    payload?: unknown,
    meta?: { url?: string; method?: string }
  ) {
    super(message);

    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
    this.url = meta?.url;
    this.method = meta?.method;
  }
}

//===================================================================

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
