import type { NextFunction, Request, Response } from 'express';

import { ACCESS_TOKEN_COOKIE_NAME, AUTH_COOKIE_NAME } from '../constants/auth';
import { API_MESSAGES } from '../constants/messages';
import { HTTP_STATUS } from '../constants/httpStatus';

import {
  assertActiveSessionService,
  getUserByIdService,
} from '../services/auth.service';
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

function getCookieValues(
  cookieHeader: string | undefined,
  name: string
): string[] {
  if (!cookieHeader) return [];

  return cookieHeader
    .split(';')
    .map((cookie) => cookie.trim())
    .map((cookie) => {
      const [cookieName, ...valueParts] = cookie.split('=');

      if (cookieName !== name) return null;

      const value = valueParts.join('=');
      return value ? decodeURIComponent(value) : null;
    })
    .filter((value): value is string => Boolean(value));
}

//===============================================================

function getTokensFromCookies(cookieHeader?: string): string[] {
  return [
    ...getCookieValues(cookieHeader, ACCESS_TOKEN_COOKIE_NAME),
    ...getCookieValues(cookieHeader, AUTH_COOKIE_NAME),
  ].reverse();
}

//===============================================================

function getTokensFromRequest(req: Request): string[] {
  const headerToken = getTokenFromHeader(req.headers.authorization);

  return [
    ...(headerToken ? [headerToken] : []),
    ...getTokensFromCookies(req.headers.cookie),
  ];
}

//===============================================================

async function authenticateToken(req: Request): Promise<void> {
  const tokens = getTokensFromRequest(req);

  if (!tokens.length) {
    throw httpError(HTTP_STATUS.UNAUTHORIZED, API_MESSAGES.AUTH_REQUIRED);
  }

  for (const token of tokens) {
    try {
      const payload = verifyToken(token);

      if (!payload.sessionId) continue;

      await assertActiveSessionService(payload.sessionId, payload.userId);

      const user = await getUserByIdService(payload.userId);

      req.authSessionId = payload.sessionId;
      req.user = user;

      return;
    } catch {
      // Keep checking the remaining cookie candidates. Browsers can send
      // duplicate auth cookies after deployments or domain/path changes, and
      // the first one can be stale while a later one is valid.
    }
  }

  throw httpError(HTTP_STATUS.UNAUTHORIZED, API_MESSAGES.INVALID_TOKEN);
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
    const tokens = getTokensFromRequest(req);

    if (!tokens.length) {
      next();
      return;
    }

    await authenticateToken(req);
    next();
  } catch {
    next();
  }
}
