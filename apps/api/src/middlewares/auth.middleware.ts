import type { NextFunction, Request, Response } from 'express';

import { AUTH_COOKIE_NAME } from '../constants/auth';
import { API_MESSAGES } from '../constants/messages';
import { HTTP_STATUS } from '../constants/httpStatus';
import { getUserByIdService } from '../services/auth.service';
import { httpError } from '../utils/httpError';
import { verifyToken } from '../utils/jwt';

//===============================================================

function getTokenFromHeader(authHeader?: string): string | null {
  if (!authHeader) return null;

  const [type, token] = authHeader.split(' ');

  if (type !== 'Bearer' || !token) return null;

  return token;
}

//===============================================================

function getTokenFromCookie(cookieHeader?: string): string | null {
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(';').map((cookie) => cookie.trim());

  for (const cookie of cookies) {
    const [name, ...valueParts] = cookie.split('=');

    if (name === AUTH_COOKIE_NAME) {
      const value = valueParts.join('=');
      return value ? decodeURIComponent(value) : null;
    }
  }

  return null;
}

//===============================================================

function getTokenFromRequest(req: Request): string | null {
  return (
    getTokenFromHeader(req.headers.authorization) ||
    getTokenFromCookie(req.headers.cookie)
  );
}

//===============================================================

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = getTokenFromRequest(req);

    if (!token) {
      throw httpError(HTTP_STATUS.UNAUTHORIZED, API_MESSAGES.AUTH_REQUIRED);
    }

    const payload = verifyToken(token);
    const user = await getUserByIdService(payload.userId);

    req.user = user;

    next();
  } catch {
    next(httpError(HTTP_STATUS.UNAUTHORIZED, API_MESSAGES.INVALID_TOKEN));
  }
}

//===============================================================

export async function optionalAuthenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = getTokenFromRequest(req);

    if (!token) {
      next();
      return;
    }

    const payload = verifyToken(token);
    const user = await getUserByIdService(payload.userId);

    req.user = user;
    next();
  } catch {
    next();
  }
}
