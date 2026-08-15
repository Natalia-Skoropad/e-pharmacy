import type { NextFunction, Request, Response } from 'express';

import {
  ACCESS_TOKEN_COOKIE_NAME,
  AUTH_COOKIE_NAME,
  AUTH_ERROR_CODES,
} from '../constants/auth';

import { API_MESSAGES } from '../constants/messages';
import { HTTP_STATUS } from '../constants/httpStatus';

import {
  assertActiveSessionService,
  getUserByIdService,
} from '../services/auth.service';

import { httpError } from '../utils/httpError';
import { logger } from '../utils/logger';
import { verifyToken } from '../utils/jwt';

//===============================================================

type ErrorWithStatus = {
  status?: unknown;
  name?: unknown;
  code?: unknown;
};

type AuthTokenCandidate = {
  token: string;
  source: 'authorization' | 'access_cookie' | 'legacy_cookie';
};

//===============================================================

function isAuthenticationCandidateError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;

  const { status, name } = error as ErrorWithStatus;

  if (status === HTTP_STATUS.UNAUTHORIZED || status === HTTP_STATUS.FORBIDDEN) {
    return true;
  }

  return (
    name === 'JsonWebTokenError' ||
    name === 'TokenExpiredError' ||
    name === 'NotBeforeError'
  );
}

//===============================================================

function hasPreservedAuthLifecycleCode(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const code = (error as ErrorWithStatus).code;

  return (
    code === AUTH_ERROR_CODES.SESSION_REVOKED ||
    code === AUTH_ERROR_CODES.USER_BLOCKED
  );
}

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

function getTokensFromCookies(cookieHeader?: string): AuthTokenCandidate[] {
  const accessCandidates = getCookieValues(
    cookieHeader,
    ACCESS_TOKEN_COOKIE_NAME
  )
    .reverse()
    .map((token) => ({ token, source: 'access_cookie' as const }));

  const legacyCandidates = getCookieValues(cookieHeader, AUTH_COOKIE_NAME)
    .reverse()
    .map((token) => ({ token, source: 'legacy_cookie' as const }));

  // Current access cookies always win over the legacy migration fallback.
  // Within one cookie name, try the last browser-provided value first so a
  // stale duplicate cannot shadow a freshly written cookie.
  return [...accessCandidates, ...legacyCandidates];
}

//===============================================================

function getTokensFromRequest(req: Request): AuthTokenCandidate[] {
  const headerToken = getTokenFromHeader(req.headers.authorization);

  return [
    ...(headerToken
      ? [{ token: headerToken, source: 'authorization' as const }]
      : []),
    ...getTokensFromCookies(req.headers.cookie),
  ];
}

//===============================================================

async function authenticateToken(req: Request): Promise<void> {
  const tokens = getTokensFromRequest(req);

  if (!tokens.length) {
    throw httpError(
      HTTP_STATUS.UNAUTHORIZED,
      API_MESSAGES.AUTH_REQUIRED,
      undefined,
      AUTH_ERROR_CODES.SESSION_INVALID
    );
  }

  let lastCandidateError: unknown;

  for (const candidate of tokens) {
    try {
      const payload = verifyToken(candidate.token);

      if (!payload.sessionId) continue;

      await assertActiveSessionService(payload.sessionId, payload.userId);

      const user = await getUserByIdService(payload.userId);

      req.authSessionId = payload.sessionId;
      req.user = user;

      if (candidate.source === 'legacy_cookie') {
        logger.security({
          type: 'legacy_auth_cookie_used',
          method: req.method,
          path: req.path,
        });
      }

      return;
    } catch (error) {
      if (!isAuthenticationCandidateError(error)) throw error;
      lastCandidateError = error;

      // Keep checking the remaining cookie candidates. Browsers can send
      // duplicate auth cookies after deployments or domain/path changes, and
      // the first one can be stale while a later one is valid.
    }
  }

  if (hasPreservedAuthLifecycleCode(lastCandidateError)) {
    throw lastCandidateError;
  }

  throw httpError(
    HTTP_STATUS.UNAUTHORIZED,
    API_MESSAGES.INVALID_TOKEN,
    undefined,
    AUTH_ERROR_CODES.SESSION_INVALID
  );
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
  } catch (error) {
    if (isAuthenticationCandidateError(error)) {
      if (hasPreservedAuthLifecycleCode(error)) {
        next(error);
      } else {
        next(
          httpError(
            HTTP_STATUS.UNAUTHORIZED,
            API_MESSAGES.INVALID_TOKEN,
            undefined,
            AUTH_ERROR_CODES.SESSION_INVALID
          )
        );
      }
      return;
    }

    next(error);
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
  } catch (error) {
    if (isAuthenticationCandidateError(error)) {
      next();
      return;
    }

    next(error);
  }
}
