import type { NextFunction, Request, Response } from 'express';

import { USER_ROLES } from '../../constants/auth/auth';
import { PHARMACY_OPERATIONAL_STATUSES } from '../../constants/pharmacies/pharmacy-status';
import { HTTP_STATUS } from '../../constants/http/httpStatus';
import { API_MESSAGES } from '../../constants/shared/messages';

import { requirePharmacyCapability } from '../../services/pharmacies/pharmacy-membership.service';
import type { UserRole } from '../../types/accounts/user';
import { httpError } from '../../utils/httpError';

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

    const { pharmacy } = await requirePharmacyCapability(
      req.user.id,
      'read_orders'
    );

    if (
      !PHARMACY_OPERATIONAL_STATUSES.includes(
        pharmacy.status as (typeof PHARMACY_OPERATIONAL_STATUSES)[number]
      )
    ) {
      next(
        httpError(
          HTTP_STATUS.FORBIDDEN,
          'Pharmacy is not allowed to sell products.'
        )
      );

      return;
    }

    next();
  } catch (error) {
    next(error);
  }
}
