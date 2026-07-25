import type { CookieOptions, Response } from 'express';

import { env } from '../config/env';

import {
  ACCESS_TOKEN_COOKIE_NAME,
  AUTH_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_NAME,
} from '../constants/auth';

import type { AuthTokens } from '../types/auth';

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

export function setAccessTokenCookie(
  res: Response,
  token: string,
  maxAgeSeconds: number
): void {
  res.cookie(ACCESS_TOKEN_COOKIE_NAME, token, {
    ...getAuthCookieOptions(),
    maxAge: maxAgeSeconds * 1000,
  });
}

//===============================================================

export function setRefreshTokenCookie(
  res: Response,
  token: string,
  maxAgeSeconds: number
): void {
  res.cookie(REFRESH_TOKEN_COOKIE_NAME, token, {
    ...getAuthCookieOptions(),
    maxAge: maxAgeSeconds * 1000,
  });
}

//===============================================================

export function setAuthCookies(res: Response, tokens: AuthTokens): void {
  setAccessTokenCookie(
    res,
    tokens.accessToken,
    tokens.accessTokenExpiresIn
  );
  setRefreshTokenCookie(
    res,
    tokens.refreshToken,
    tokens.refreshTokenExpiresIn
  );
}

//===============================================================

export function clearAuthCookies(res: Response): void {
  const options = getAuthCookieOptions();

  res.clearCookie(ACCESS_TOKEN_COOKIE_NAME, options);
  res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, options);

  // Remove the legacy cookie if it was issued before the migration.
  res.clearCookie(AUTH_COOKIE_NAME, options);
}
