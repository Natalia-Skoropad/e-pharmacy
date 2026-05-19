import type { Request, Response } from 'express';

import { API_MESSAGES } from '../constants/messages';
import { HTTP_STATUS } from '../constants/httpStatus';

import {
  loginUserService,
  registerUserService,
  requestPasswordResetService,
  resetPasswordService,
  updateUserPasswordService,
  updateUserProfileService,
} from '../services/auth.service';

import type {
  ForgotPasswordInput,
  LoginInput,
  ResetPasswordInput,
  RegisterInput,
  UpdatePasswordInput,
  UpdateProfileInput,
} from '../types/auth';
import { sendSuccessResponse } from '../utils/apiResponse';
import { clearAuthCookie, setAuthCookie } from '../utils/authCookie';

//===============================================================

export async function registerUser(req: Request, res: Response): Promise<void> {
  const input = req.body as RegisterInput;

  const data = await registerUserService(input);

  setAuthCookie(res, data.token);

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.CREATED,
    message: API_MESSAGES.USER_REGISTERED,
    data,
  });
}

//===============================================================

export async function loginUser(req: Request, res: Response): Promise<void> {
  const input = req.body as LoginInput;

  const data = await loginUserService(input);

  setAuthCookie(res, data.token);

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    message: API_MESSAGES.USER_LOGGED_IN,
    data,
  });
}


//===============================================================

export async function requestPasswordReset(
  req: Request,
  res: Response
): Promise<void> {
  const input = req.body as ForgotPasswordInput;

  await requestPasswordResetService(input);

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    message: API_MESSAGES.PASSWORD_RESET_EMAIL_SENT,
  });
}

//===============================================================


//===============================================================

export async function resetPassword(req: Request, res: Response): Promise<void> {
  const input = req.body as ResetPasswordInput;

  await resetPasswordService(input);

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    message: API_MESSAGES.PASSWORD_RESET_SUCCESS,
  });
}

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



//===============================================================

export async function updateCurrentUser(
  req: Request,
  res: Response
): Promise<void> {
  const input = req.body as UpdateProfileInput;
  const userId = req.user?.id;

  if (!userId) return;

  const user = await updateUserProfileService(userId, input);

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

export async function updateCurrentUserPassword(
  req: Request,
  res: Response
): Promise<void> {
  const input = req.body as UpdatePasswordInput;
  const userId = req.user?.id;

  if (!userId) return;

  await updateUserPasswordService(userId, input);

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    message: 'Password was updated successfully.',
  });
}

export function logoutUser(_req: Request, res: Response): void {
  clearAuthCookie(res);

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    message: API_MESSAGES.USER_LOGGED_OUT,
  });
}

//===============================================================

export function getCustomerOnlyTest(req: Request, res: Response): void {
  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    message: 'Customer route is available',
    data: {
      user: req.user,
    },
  });
}

//===============================================================

export function getVendorOnlyTest(req: Request, res: Response): void {
  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    message: 'Vendor route is available',
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
