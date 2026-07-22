import type { Request, Response } from 'express';

import { REFRESH_TOKEN_COOKIE_NAME } from '../constants/auth';
import { env } from '../config/env';
import { API_MESSAGES } from '../constants/messages';
import { HTTP_STATUS } from '../constants/httpStatus';

import {
  loginUserService,
  refreshAuthSessionService,
  registerUserService,
  requestPasswordResetService,
  resetPasswordService,
  revokeAllUserSessionsService,
  revokeCurrentSessionService,
  getActiveSessionsService,
  revokeUserSessionService,
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

import type { SessionContext } from '../types/session';
import type { ValidatedResponse } from '../types/validated-request';
import { sendSuccessResponse } from '../utils/apiResponse';
import { clearAuthCookies, setAuthCookies } from '../utils/authCookie';
import { httpError } from '../utils/httpError';

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

function isNextAuthProxyRequest(req: Request): boolean {
  const marker = req.headers['x-e-pharmacy-auth-proxy'];
  const secret = req.headers['x-e-pharmacy-bff-secret'];
  const configuredSecret = env.BFF_PROXY_SECRET?.trim();

  if (marker !== 'next-bff') return false;

  if (!configuredSecret) {
    return env.NODE_ENV !== 'production';
  }

  return secret === configuredSecret;
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
  const refreshTokens = getCookieValues(req, REFRESH_TOKEN_COOKIE_NAME);

  if (!refreshTokens.length) {
    throw httpError(HTTP_STATUS.UNAUTHORIZED, API_MESSAGES.AUTH_REQUIRED);
  }

  return refreshTokens;
}

//===============================================================

export async function registerUser(
  req: Request,
  res: ValidatedResponse<RegisterInput>
): Promise<void> {
  const input = res.locals.validated.body;

  const data = await registerUserService(input, getSessionContext(req));

  setAuthCookies(res, data.tokens);

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

  setAuthCookies(res, data.tokens);

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
  const refreshTokens = getRefreshTokensFromCookies(req);
  const context = getSessionContext(req);
  let data: Awaited<ReturnType<typeof refreshAuthSessionService>> | null = null;
  let lastError: unknown;

  for (const refreshToken of refreshTokens) {
    try {
      data = await refreshAuthSessionService(refreshToken, context);
      break;
    } catch (error) {
      lastError = error;
    }
  }

  if (!data) {
    throw lastError;
  }

  setAuthCookies(res, data.tokens);

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    message: 'Session was refreshed successfully.',
    data: createAuthResponseData(req, data),
  });
}

//===============================================================

export async function requestPasswordReset(
  req: Request,
  res: ValidatedResponse<ForgotPasswordInput>
): Promise<void> {
  const input = res.locals.validated.body;

  await requestPasswordResetService(input);

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    message: API_MESSAGES.PASSWORD_RESET_EMAIL_SENT,
  });
}

//===============================================================

export async function resetPassword(
  req: Request,
  res: ValidatedResponse<ResetPasswordInput>
): Promise<void> {
  const input = res.locals.validated.body;

  await resetPasswordService(input);
  clearAuthCookies(res);

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    message: API_MESSAGES.PASSWORD_RESET_SUCCESS,
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

export async function updateCurrentUser(
  req: Request,
  res: ValidatedResponse<UpdateProfileInput>
): Promise<void> {
  const input = res.locals.validated.body;
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
  res: ValidatedResponse<UpdatePasswordInput>
): Promise<void> {
  const input = res.locals.validated.body;
  const userId = req.user?.id;

  if (!userId) return;

  await updateUserPasswordService(userId, input);
  clearAuthCookies(res);

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    message: 'Password was updated successfully. Please sign in again.',
  });
}

//===============================================================

export async function logoutUser(req: Request, res: Response): Promise<void> {
  await revokeCurrentSessionService(req.authSessionId);
  clearAuthCookies(res);

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
  const userId = req.user?.id;

  if (!userId) return;

  await revokeAllUserSessionsService(userId);
  clearAuthCookies(res);

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    message: 'You have been signed out from all devices.',
  });
}

//===============================================================

export function getClientOnlyTest(req: Request, res: Response): void {
  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    message: 'Client route is available',
    data: {
      user: req.user,
    },
  });
}

//===============================================================

export function getPharmacyOnlyTest(req: Request, res: Response): void {
  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    message: 'Pharmacy route is available',
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

//===============================================================

export async function getActiveSessions(
  req: Request,
  res: Response
): Promise<void> {
  const userId = req.user?.id;
  if (!userId) return;
  const data = await getActiveSessionsService(userId, req.authSessionId);
  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function revokeActiveSession(
  req: Request,
  res: Response
): Promise<void> {
  const userId = req.user?.id;
  if (!userId) return;
  const sessionId = String(req.params.sessionId ?? '');
  await revokeUserSessionService(userId, sessionId);
  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    message: 'Session was revoked successfully.',
  });
}
