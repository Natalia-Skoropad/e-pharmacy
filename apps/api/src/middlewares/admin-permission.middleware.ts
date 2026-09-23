import type { NextFunction, Request, Response } from 'express';

import { ADMIN_ACCESS_ERROR_CODES } from '../constants/admin-access';

import {
  isAdminPermission,
  type AdminPermission,
} from '../constants/admin-permissions';

import { HTTP_STATUS } from '../constants/httpStatus';
import { getAdminAuthorizationService } from '../services/admin-access.service';
import { hasAdminPermission } from '../services/admin-permission-evaluator';
import { httpError } from '../utils/httpError';

//===============================================================

export async function resolveAdminAuthorization(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      next(httpError(HTTP_STATUS.UNAUTHORIZED, 'Authentication is required.'));
      return;
    }

    req.adminAuthorization = await getAdminAuthorizationService(req.user.id);
    next();
  } catch (error) {
    next(error);
  }
}

//===============================================================

export function requireAdminPermission(permission: AdminPermission) {
  if (!isAdminPermission(permission)) {
    throw new TypeError('Unknown admin permission configured for route.');
  }

  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!hasAdminPermission(req.adminAuthorization, permission)) {
      next(
        httpError(
          HTTP_STATUS.FORBIDDEN,
          'Admin permission is required.',
          undefined,
          ADMIN_ACCESS_ERROR_CODES.PERMISSION_DENIED
        )
      );
      return;
    }

    next();
  };
}
