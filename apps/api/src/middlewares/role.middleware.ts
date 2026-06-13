import type { NextFunction, Request, Response } from 'express';

import { USER_ROLES, PHARMACY_ACCOUNT_STATUSES } from '../constants/auth';
import { HTTP_STATUS } from '../constants/httpStatus';
import { API_MESSAGES } from '../constants/messages';
import { User } from '../models/user.model';
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

//===============================================================

export async function requireActivePharmacy(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      next(httpError(HTTP_STATUS.UNAUTHORIZED, API_MESSAGES.AUTH_REQUIRED));
      return;
    }

    if (req.user.role !== USER_ROLES.PHARMACY) {
      next(httpError(HTTP_STATUS.FORBIDDEN, API_MESSAGES.FORBIDDEN_ROLE));
      return;
    }

    const pharmacy = await User.findOne({
      _id: req.user.id,
      role: USER_ROLES.PHARMACY,
      pharmacyStatus: PHARMACY_ACCOUNT_STATUSES.ACTIVE,
    })
      .select('_id')
      .lean<{ _id: unknown } | null>();

    if (!pharmacy) {
      next(httpError(HTTP_STATUS.FORBIDDEN, 'Pharmacy account is not active.'));
      return;
    }

    next();
  } catch (error) {
    next(error);
  }
}
