import type { Request } from 'express';

import { API_MESSAGES } from '../../constants/shared/messages';
import { HTTP_STATUS } from '../../constants/http/httpStatus';

import {
  requestPasswordResetService,
  resetPasswordService,
  updateUserPasswordService,
} from '../../services/auth/auth-password.service';

import type {
  ForgotPasswordInput,
  ResetPasswordInput,
  UpdatePasswordInput,
} from '../../types/auth/auth';

import type { ValidatedResponse } from '../../types/http/validated-request';
import { sendSuccessResponse } from '../../utils/http/apiResponse';

//===============================================================

// Domain controller handlers; imported directly by routes.

export async function requestPasswordReset(
  req: Request,
  res: ValidatedResponse<ForgotPasswordInput>
): Promise<void> {
  const input = res.locals.validated.body;

  await requestPasswordResetService(input);

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    message: API_MESSAGES.PASSWORD_RESET_EMAIL_SENT,
  });
}

//===============================================================

export async function resetPassword(
  req: Request,
  res: ValidatedResponse<ResetPasswordInput>
): Promise<void> {
  const input = res.locals.validated.body;

  await resetPasswordService(input);

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    message: API_MESSAGES.PASSWORD_RESET_SUCCESS,
  });
}

//===============================================================

export async function updateCurrentUserPassword(
  req: Request,
  res: ValidatedResponse<UpdatePasswordInput>
): Promise<void> {
  const input = res.locals.validated.body;
  const userId = req.user?.id;

  if (!userId) return;

  await updateUserPasswordService(userId, input);

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    message: 'Password was updated successfully. Please sign in again.',
  });
}
