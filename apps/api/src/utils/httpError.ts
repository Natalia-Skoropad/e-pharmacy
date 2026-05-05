import type { HttpError, HttpErrorStatus } from '../types/errors';

//===============================================================

export function httpError(status: HttpErrorStatus, message: string): HttpError {
  const error = new Error(message) as HttpError;

  error.status = status;

  return error;
}
