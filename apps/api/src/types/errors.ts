export type HttpErrorStatus = 400 | 401 | 403 | 404 | 409 | 500;

//===============================================================

export type ValidationErrorDetails = Record<string, string[]>;

//===============================================================

export type HttpError = Error & {
  status: HttpErrorStatus;
  details?: ValidationErrorDetails;
};
