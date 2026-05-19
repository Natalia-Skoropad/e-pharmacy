import type { CookieOptions, Response } from 'express';

import { env } from '../config/env';
import { AUTH_COOKIE_NAME } from '../constants/auth';

//===============================================================

const AUTH_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

//===============================================================

function getAuthCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    ...(env.AUTH_COOKIE_DOMAIN ? { domain: env.AUTH_COOKIE_DOMAIN } : {}),
  };
}

//===============================================================

export function setAuthCookie(res: Response, token: string): void {
  res.cookie(AUTH_COOKIE_NAME, token, {
    ...getAuthCookieOptions(),
    maxAge: AUTH_COOKIE_MAX_AGE_MS,
  });
}

//===============================================================

export function clearAuthCookie(res: Response): void {
  res.clearCookie(AUTH_COOKIE_NAME, getAuthCookieOptions());
}
