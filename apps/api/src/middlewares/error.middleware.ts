import type { ErrorRequestHandler } from 'express';

import { HTTP_STATUS } from '../constants/httpStatus';
import { API_MESSAGES } from '../constants/messages';
import type { HttpError } from '../types/errors';

//===============================================================

function isHttpError(error: unknown): error is HttpError {
  return (
    error instanceof Error &&
    'status' in error &&
    typeof error.status === 'number'
  );
}

//===============================================================

export const errorMiddleware: ErrorRequestHandler = (
  error,
  _req,
  res,
  _next
) => {
  const status = isHttpError(error)
    ? error.status
    : HTTP_STATUS.INTERNAL_SERVER_ERROR;

  const message =
    error instanceof Error ? error.message : API_MESSAGES.INTERNAL_SERVER_ERROR;

  res.status(status).json({
    status: 'error',
    message,
  });
};
