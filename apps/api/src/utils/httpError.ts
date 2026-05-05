import type {
  HttpError,
  HttpErrorStatus,
  ValidationErrorDetails,
} from '../types/errors';

//===============================================================

export function httpError(
  status: HttpErrorStatus,
  message: string,
  details?: ValidationErrorDetails
): HttpError {
  const error = new Error(message) as HttpError;

  error.status = status;
  error.details = details;

  return error;
}
