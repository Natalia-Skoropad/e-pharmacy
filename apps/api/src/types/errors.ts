export type HttpErrorStatus = 400 | 401 | 403 | 404 | 409 | 500;

//===============================================================

export type HttpError = Error & {
  status: HttpErrorStatus;
};
