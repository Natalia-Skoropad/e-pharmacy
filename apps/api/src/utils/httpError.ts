import type {
  HttpError,
  HttpErrorStatus,
  ValidationErrorDetails,
} from '../types/errors';

//===============================================================

export function httpError(
  status: HttpErrorStatus,
  message: string,
  details?: ValidationErrorDetails,
  code?: string
): HttpError {
  const error = new Error(message) as HttpError;

  error.status = status;
  error.details = details;
  error.code = code;

  return error;
}
