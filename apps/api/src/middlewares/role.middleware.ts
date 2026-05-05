import type { NextFunction, Request, Response } from 'express';

import { API_MESSAGES } from '../constants/messages';
import { HTTP_STATUS } from '../constants/httpStatus';
import type { UserRole } from '../types/user';
import { httpError } from '../utils/httpError';

//===============================================================

export function authorizeRoles(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(httpError(HTTP_STATUS.UNAUTHORIZED, API_MESSAGES.AUTH_REQUIRED));
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(httpError(HTTP_STATUS.FORBIDDEN, API_MESSAGES.FORBIDDEN_ROLE));
      return;
    }

    next();
  };
}
