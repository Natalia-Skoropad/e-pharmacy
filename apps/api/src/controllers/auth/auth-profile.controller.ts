import type { Request, Response } from 'express';

import { HTTP_STATUS } from '../../constants/http/httpStatus';

import { updateUserProfileService } from '../../services/auth/auth-profile.service';

import type { UpdateProfileInput } from '../../types/auth/auth';
import type { ValidatedResponse } from '../../types/http/validated-request';

import { sendSuccessResponse } from '../../utils/http/apiResponse';

//===============================================================

// Domain controller handlers; imported directly by routes.

export function getCurrentUser(req: Request, res: Response): void {
  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.OK,

    data: {
      user: req.user,
    },
  });
}

//===============================================================

export async function updateCurrentUser(
  req: Request,
  res: ValidatedResponse<UpdateProfileInput>
): Promise<void> {
  const input = res.locals.validated.body;
  const userId = req.user?.id;

  if (!userId) return;

  const user = await updateUserProfileService(
    userId,
    input,
    res.locals.requestId
  );

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    message: 'Profile was updated successfully.',

    data: {
      user,
    },
  });
}

//===============================================================

export function getClientOnlyTest(req: Request, res: Response): void {
  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    message: 'Client route is available',

    data: {
      user: req.user,
    },
  });
}

//===============================================================

export function getPharmacyOnlyTest(req: Request, res: Response): void {
  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    message: 'Pharmacy route is available',

    data: {
      user: req.user,
    },
  });
}

//===============================================================

export function getAdminOnlyTest(req: Request, res: Response): void {
  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    message: 'Admin route is available',

    data: {
      user: req.user,
    },
  });
}
