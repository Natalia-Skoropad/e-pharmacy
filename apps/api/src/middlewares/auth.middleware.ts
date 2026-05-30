import type { NextFunction, Request, Response } from 'express';

import { ACCESS_TOKEN_COOKIE_NAME, AUTH_COOKIE_NAME } from '../constants/auth';
import { API_MESSAGES } from '../constants/messages';
import { HTTP_STATUS } from '../constants/httpStatus';
import { assertActiveSessionService, getUserByIdService } from '../services/auth.service';
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

function getCookieValue(cookieHeader: string | undefined, name: string): string | null {
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(';').map((cookie) => cookie.trim());

  for (const cookie of cookies) {
    const [cookieName, ...valueParts] = cookie.split('=');

    if (cookieName === name) {
      const value = valueParts.join('=');
      return value ? decodeURIComponent(value) : null;
    }
  }

  return null;
}

//===============================================================

function getTokenFromCookie(cookieHeader?: string): string | null {
  return (
    getCookieValue(cookieHeader, ACCESS_TOKEN_COOKIE_NAME) ||
    getCookieValue(cookieHeader, AUTH_COOKIE_NAME)
  );
}

//===============================================================

function getTokenFromRequest(req: Request): string | null {
  return (
    getTokenFromHeader(req.headers.authorization) ||
    getTokenFromCookie(req.headers.cookie)
  );
}

//===============================================================

async function authenticateToken(req: Request): Promise<void> {
  const token = getTokenFromRequest(req);

  if (!token) {
    throw httpError(HTTP_STATUS.UNAUTHORIZED, API_MESSAGES.AUTH_REQUIRED);
  }

  const payload = verifyToken(token);

  if (!payload.sessionId) {
    throw httpError(HTTP_STATUS.UNAUTHORIZED, API_MESSAGES.INVALID_TOKEN);
  }

  await assertActiveSessionService(payload.sessionId, payload.userId);

  const user = await getUserByIdService(payload.userId);

  req.authSessionId = payload.sessionId;
  req.user = user;
}

//===============================================================

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await authenticateToken(req);

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

    await authenticateToken(req);
    next();
  } catch {
    next();
  }
}
