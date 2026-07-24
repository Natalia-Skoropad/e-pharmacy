import type { ErrorRequestHandler } from 'express';

import { HTTP_STATUS } from '../constants/httpStatus';
import { API_MESSAGES } from '../constants/messages';
import type { HttpError } from '../types/errors';

import {
  isDuplicateEmailError,
  isDuplicatePhoneError,
} from '../utils/mongoError';

//===============================================================

const isProduction = process.env.NODE_ENV === 'production';

//===============================================================

function isHttpError(error: unknown): error is HttpError {
  return (
    error instanceof Error &&
    'status' in error &&
    typeof error.status === 'number'
  );
}

//===============================================================

export const errorMiddleware: ErrorRequestHandler = (error, req, res, next) => {
  void req;
  void next;

  if (isDuplicateEmailError(error) || isDuplicatePhoneError(error)) {
    res.status(HTTP_STATUS.CONFLICT).json({
      status: 'error',
      message: isDuplicatePhoneError(error)
        ? API_MESSAGES.PHONE_IN_USE
        : API_MESSAGES.EMAIL_IN_USE,
    });

    return;
  }

  const status = isHttpError(error)
    ? error.status
    : HTTP_STATUS.INTERNAL_SERVER_ERROR;

  const message =
    isHttpError(error) || !isProduction
      ? error instanceof Error
        ? error.message
        : API_MESSAGES.INTERNAL_SERVER_ERROR
      : API_MESSAGES.INTERNAL_SERVER_ERROR;

  const responseBody = {
    status: 'error',
    message,
    ...(res.locals.requestId ? { requestId: res.locals.requestId } : {}),
    ...(isHttpError(error) && error.details ? { details: error.details } : {}),
    ...(!isProduction && error instanceof Error && error.stack
      ? { stack: error.stack }
      : {}),
  };

  res.status(status).json(responseBody);
};
