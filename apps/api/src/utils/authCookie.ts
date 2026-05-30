import type { CookieOptions, Response } from 'express';

import { env } from '../config/env';

import {
  ACCESS_TOKEN_COOKIE_NAME,
  AUTH_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_NAME,
} from '../constants/auth';

import { parseDurationMs } from './duration';

//===============================================================

const ACCESS_TOKEN_COOKIE_MAX_AGE_MS = parseDurationMs(
  String(env.JWT_EXPIRES_IN),
  15 * 60 * 1000
);

const REFRESH_TOKEN_COOKIE_MAX_AGE_MS = parseDurationMs(
  String(env.REFRESH_TOKEN_EXPIRES_IN),
  30 * 24 * 60 * 60 * 1000
);

//===============================================================

function getAuthCookieOptions(): CookieOptions {
  const requiresSecureCookie =
    env.NODE_ENV === 'production' || env.AUTH_COOKIE_SAME_SITE === 'none';

  return {
    httpOnly: true,
    secure: requiresSecureCookie,
    sameSite: env.AUTH_COOKIE_SAME_SITE,
    path: '/',
    ...(env.AUTH_COOKIE_DOMAIN ? { domain: env.AUTH_COOKIE_DOMAIN } : {}),
  };
}

//===============================================================

export function setAccessTokenCookie(res: Response, token: string): void {
  res.cookie(ACCESS_TOKEN_COOKIE_NAME, token, {
    ...getAuthCookieOptions(),
    maxAge: ACCESS_TOKEN_COOKIE_MAX_AGE_MS,
  });
}

//===============================================================

export function setRefreshTokenCookie(res: Response, token: string): void {
  res.cookie(REFRESH_TOKEN_COOKIE_NAME, token, {
    ...getAuthCookieOptions(),
    maxAge: REFRESH_TOKEN_COOKIE_MAX_AGE_MS,
  });
}

//===============================================================

export function setAuthCookies(
  res: Response,
  tokens: { accessToken: string; refreshToken?: string }
): void {
  setAccessTokenCookie(res, tokens.accessToken);

  if (tokens.refreshToken) {
    setRefreshTokenCookie(res, tokens.refreshToken);
  }
}

//===============================================================

export function clearAuthCookies(res: Response): void {
  const options = getAuthCookieOptions();

  res.clearCookie(ACCESS_TOKEN_COOKIE_NAME, options);
  res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, options);

  // Remove the legacy cookie if it was issued before the migration.
  res.clearCookie(AUTH_COOKIE_NAME, options);
}

//===============================================================

// Backward-compatible wrappers for older imports.
export const setAuthCookie = setAccessTokenCookie;
export const clearAuthCookie = clearAuthCookies;
