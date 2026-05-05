import type { Request, Response } from 'express';

import { API_MESSAGES } from '../constants/messages';
import { HTTP_STATUS } from '../constants/httpStatus';

import {
  loginUserService,
  registerUserService,
} from '../services/auth.service';

import type { LoginInput, RegisterInput } from '../types/auth';
import { sendSuccessResponse } from '../utils/apiResponse';

//===============================================================

export async function registerUser(req: Request, res: Response): Promise<void> {
  const input = req.body as RegisterInput;

  const data = await registerUserService(input);

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

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    message: API_MESSAGES.USER_LOGGED_IN,
    data,
  });
}

//===============================================================

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

export function logoutUser(_req: Request, res: Response): void {
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
