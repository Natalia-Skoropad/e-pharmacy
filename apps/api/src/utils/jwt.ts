import jwt from 'jsonwebtoken';

import { env } from '../config/env';
import { API_MESSAGES } from '../constants/messages';
import { HTTP_STATUS } from '../constants/httpStatus';
import type { UserRole } from '../types/user';
import { httpError } from './httpError';

//===============================================================

export type JwtPayload = {
  userId: string;
  role: UserRole;
};

export type PasswordResetJwtPayload = {
  sub: string;
  email: string;
};

//===============================================================

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
}

//===============================================================

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}

//===============================================================

export function signPasswordResetToken(payload: PasswordResetJwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_RESET_EXPIRES_IN,
  });
}

//===============================================================

export function verifyPasswordResetToken(token: string): PasswordResetJwtPayload {
  try {
    return jwt.verify(token, env.JWT_SECRET) as PasswordResetJwtPayload;
  } catch {
    throw httpError(
      HTTP_STATUS.BAD_REQUEST,
      API_MESSAGES.PASSWORD_RESET_TOKEN_INVALID
    );
  }
}
