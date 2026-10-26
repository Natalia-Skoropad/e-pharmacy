import type { Request, Response } from 'express';

import {
  AUTH_ERROR_CODES,
  REFRESH_TOKEN_COOKIE_NAME,
} from '../../constants/auth/auth';

import { API_MESSAGES } from '../../constants/shared/messages';
import { HTTP_STATUS } from '../../constants/http/httpStatus';

import { isNextAuthProxyRequest } from '../../middlewares/auth/auth-bff.middleware';

import {
  refreshAuthSessionService,
  revokeAllUserSessionsByRefreshTokensService,
  revokeSessionByRefreshTokenService,
} from '../../services/auth/auth-sessions.service';

import { registerUserService } from '../../services/auth/auth-register.service';
import { loginUserService } from '../../services/auth/auth-login.service';

import type { LoginInput, RegisterInput } from '../../types/auth/auth';
import type { SessionContext } from '../../types/auth/session';
import type { ValidatedResponse } from '../../types/http/validated-request';

import { sendSuccessResponse } from '../../utils/http/apiResponse';
import { httpError } from '../../utils/http/httpError';

//===============================================================

function getSessionContext(req: Request): SessionContext {
  const forwardedFor = req.headers['x-forwarded-for'];

  const ip = Array.isArray(forwardedFor)
    ? forwardedFor[0]
    : forwardedFor?.split(',')[0]?.trim() || req.ip;

  const deviceNameHeader = req.headers['x-device-name'];

  const deviceName = Array.isArray(deviceNameHeader)
    ? deviceNameHeader[0]
    : deviceNameHeader;

  return {
    userAgent: req.headers['user-agent'],
    ip,
    deviceName,
  };
}

//===============================================================

function createAuthResponseData(
  req: Request,
  data: Awaited<ReturnType<typeof loginUserService>>
): {
  user: typeof data.user;
  tokens?: typeof data.tokens;
} {
  return {
    user: data.user,

    ...(isNextAuthProxyRequest(req) ? { tokens: data.tokens } : {}),
  };
}

//===============================================================

function getCookieValues(req: Request, name: string): string[] {
  const cookieHeader = req.headers.cookie;

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

    .filter((value): value is string => Boolean(value))
    .reverse();
}

//===============================================================

function getRefreshTokensFromCookies(req: Request): string[] {
  return getCookieValues(req, REFRESH_TOKEN_COOKIE_NAME);
}

//===============================================================

function requireRefreshTokensFromCookies(req: Request): string[] {
  const refreshTokens = getRefreshTokensFromCookies(req);

  if (!refreshTokens.length) {
    throw httpError(
      HTTP_STATUS.UNAUTHORIZED,
      API_MESSAGES.AUTH_REQUIRED,
      undefined,

      AUTH_ERROR_CODES.SESSION_INVALID
    );
  }

  return refreshTokens;
}

//===============================================================

export async function registerUser(
  req: Request,
  res: ValidatedResponse<RegisterInput>
): Promise<void> {
  const input = res.locals.validated.body;

  const data = await registerUserService(
    input,
    getSessionContext(req),
    res.locals.requestId
  );

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.CREATED,
    message: API_MESSAGES.USER_REGISTERED,
    data: createAuthResponseData(req, data),
  });
}

//===============================================================

export async function loginUser(
  req: Request,
  res: ValidatedResponse<LoginInput>
): Promise<void> {
  const input = res.locals.validated.body;
  const data = await loginUserService(input, getSessionContext(req));

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    message: API_MESSAGES.USER_LOGGED_IN,
    data: createAuthResponseData(req, data),
  });
}

//===============================================================

export async function refreshAuthSession(
  req: Request,
  res: Response
): Promise<void> {
  const refreshTokens = requireRefreshTokensFromCookies(req);
  const context = getSessionContext(req);

  let data: Awaited<ReturnType<typeof refreshAuthSessionService>> | null = null;
  let lastError: unknown;

  for (const refreshToken of refreshTokens) {
    try {
      data = await refreshAuthSessionService(
        refreshToken,
        context,
        refreshTokens
      );

      break;
    } catch (error) {
      lastError = error;
    }
  }

  if (!data) {
    throw lastError;
  }

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    message: 'Session was refreshed successfully.',
    data: createAuthResponseData(req, data),
  });
}

//===============================================================

export async function logoutUser(req: Request, res: Response): Promise<void> {
  const refreshTokens = getRefreshTokensFromCookies(req);

  await Promise.all(
    refreshTokens.map((refreshToken) =>
      revokeSessionByRefreshTokenService(refreshToken)
    )
  );

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    message: API_MESSAGES.USER_LOGGED_OUT,
  });
}

//===============================================================

export async function logoutAllUserSessions(
  req: Request,
  res: Response
): Promise<void> {
  const refreshTokens = getRefreshTokensFromCookies(req);

  await revokeAllUserSessionsByRefreshTokensService(refreshTokens);

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    message: 'You have been signed out from all devices.',
  });
}
