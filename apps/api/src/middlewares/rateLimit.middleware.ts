import rateLimit from 'express-rate-limit';

import { HTTP_STATUS } from '../constants/httpStatus';

//===============================================================

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;

//===============================================================

function createRateLimit(max: number, message: string) {
  return rateLimit({
    windowMs: RATE_LIMIT_WINDOW_MS,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
    message: {
      status: 'error',
      message,
    },
  });
}

//===============================================================

export const authRateLimit = createRateLimit(
  20,
  'Too many authentication attempts. Please try again later.'
);

//===============================================================

export const passwordResetRateLimit = createRateLimit(
  5,
  'Too many password reset requests. Please try again later.'
);

//===============================================================

export const reviewRateLimit = createRateLimit(
  10,
  'Too many review submissions. Please try again later.'
);
