import type { NextFunction, Request, Response } from 'express';

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

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = getTokenFromHeader(req.headers.authorization);

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
    const token = getTokenFromHeader(req.headers.authorization);

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
