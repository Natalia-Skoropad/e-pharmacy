import type { Request, Response } from 'express';

import { API_MESSAGES } from '../constants/messages';
import { HTTP_STATUS } from '../constants/httpStatus';

import {
  loginUserService,
  registerUserService,
} from '../services/auth.service';

import type { LoginInput, RegisterInput } from '../types/auth';

//===============================================================

export async function registerUser(req: Request, res: Response): Promise<void> {
  const input = req.body as RegisterInput;

  const data = await registerUserService(input);

  res.status(HTTP_STATUS.CREATED).json({
    status: 'success',
    message: API_MESSAGES.USER_REGISTERED,
    data,
  });
}

//===============================================================

export async function loginUser(req: Request, res: Response): Promise<void> {
  const input = req.body as LoginInput;

  const data = await loginUserService(input);

  res.status(HTTP_STATUS.OK).json({
    status: 'success',
    message: API_MESSAGES.USER_LOGGED_IN,
    data,
  });
}

//===============================================================

export function getCurrentUser(req: Request, res: Response): void {
  res.status(HTTP_STATUS.OK).json({
    status: 'success',
    data: {
      user: req.user,
    },
  });
}

//===============================================================

export function logoutUser(_req: Request, res: Response): void {
  res.status(HTTP_STATUS.OK).json({
    status: 'success',
    message: API_MESSAGES.USER_LOGGED_OUT,
  });
}
