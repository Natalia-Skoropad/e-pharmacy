import type { Request } from 'express';

import { ADMIN_ACCESS_ERROR_CODES } from '../constants/admin-access';
import { HTTP_STATUS } from '../constants/httpStatus';

import type { UpdateMyAdminEmployeeProfileInput } from '../schemas/admin-employee-profile.schema';
import { updateMyAdminEmployeeProfileService } from '../services/admin-employee-profile.service';
import type { ValidatedResponse } from '../types/validated-request';

import { sendSuccessResponse } from '../utils/apiResponse';
import { httpError } from '../utils/httpError';

//===============================================================

export async function updateMyAdminEmployeeProfile(
  req: Request,
  res: ValidatedResponse<UpdateMyAdminEmployeeProfileInput>
): Promise<void> {
  const userId = req.user?.id;
  const authorization = req.adminAuthorization;

  if (!userId || !authorization) {
    throw httpError(
      HTTP_STATUS.FORBIDDEN,
      'Admin access is required.',
      undefined,
      ADMIN_ACCESS_ERROR_CODES.ACCESS_REQUIRED
    );
  }

  const user = await updateMyAdminEmployeeProfileService(
    userId,
    authorization,
    res.locals.validated.body
  );

  res.setHeader('Cache-Control', 'no-store');

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    message: 'Admin profile was updated successfully.',
    data: { user },
  });
}
