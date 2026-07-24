import 'server-only';
import type { NextRequest, NextResponse } from 'next/server';

import {
  ACCESS_TOKEN_COOKIE_NAME,
  AUTH_READY_COOKIE_MAX_AGE_SECONDS,
  AUTH_READY_COOKIE_NAME,
  LEGACY_AUTH_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_MAX_AGE_SECONDS,
  REFRESH_TOKEN_COOKIE_NAME,
} from '@e-pharmacy/config/auth';

import type { AuthProxyTokens } from './auth-tokens';
import { getNextApiServerEnvironment } from './env';

//===================================================================

const ACCESS_TOKEN_MAX_AGE_SECONDS = 15 * 60;

type ProxyCookieSameSite = 'lax' | 'strict' | 'none';

//===================================================================

function isSecureRequest(request: NextRequest): boolean {
  const forwardedProtocol = request.headers
    .get('x-forwarded-proto')
    ?.split(',')[0]
    ?.trim()
    .toLowerCase();

  return (
    request.nextUrl.protocol === 'https:' ||
    forwardedProtocol === 'https' ||
    getNextApiServerEnvironment().nodeEnv === 'production'
  );
}

//===================================================================

function getAuthCookieBaseOptions(request: NextRequest) {
  const environment = getNextApiServerEnvironment();
  const sameSite: ProxyCookieSameSite = environment.authCookieSameSite;

  return {
    httpOnly: true,
    path: '/',
    sameSite,
    secure: isSecureRequest(request) || sameSite === 'none',
    ...(environment.authCookieDomain
      ? { domain: environment.authCookieDomain }
      : {}),
  } as const;
}

//===================================================================

function getAuthHintCookieOptions(request: NextRequest) {
  const { httpOnly: _httpOnly, ...options } = getAuthCookieBaseOptions(request);
  void _httpOnly;
  return options;
}

//===================================================================

export function setClientAuthCookies(
  response: NextResponse,
  request: NextRequest,
  tokens: AuthProxyTokens
): void {
  const baseOptions = getAuthCookieBaseOptions(request);

  response.cookies.set(ACCESS_TOKEN_COOKIE_NAME, tokens.accessToken, {
    ...baseOptions,
    maxAge: ACCESS_TOKEN_MAX_AGE_SECONDS,
  });

  response.cookies.set(REFRESH_TOKEN_COOKIE_NAME, tokens.refreshToken, {
    ...baseOptions,
    maxAge: REFRESH_TOKEN_COOKIE_MAX_AGE_SECONDS,
  });

  response.cookies.set(AUTH_READY_COOKIE_NAME, '1', {
    ...getAuthHintCookieOptions(request),
    maxAge: AUTH_READY_COOKIE_MAX_AGE_SECONDS,
  });
}

//===================================================================

function clearCookieVariants(
  response: NextResponse,
  name: string,
  request: NextRequest,
  httpOnly: boolean
): void {
  const configured = getAuthCookieBaseOptions(request);
  const base = httpOnly
    ? configured
    : (() => {
        const { httpOnly: _httpOnly, ...hintOptions } = configured;
        void _httpOnly;
        return hintOptions;
      })();

  response.cookies.set(name, '', { ...base, maxAge: 0 });

  if ('domain' in base) {
    const { domain: _domain, ...hostOnlyOptions } = base;
    void _domain;
    response.cookies.set(name, '', { ...hostOnlyOptions, maxAge: 0 });
  }
}

//===================================================================

export function clearClientAuthCookies(
  response: NextResponse,
  request: NextRequest
): void {
  clearCookieVariants(response, ACCESS_TOKEN_COOKIE_NAME, request, true);
  clearCookieVariants(response, REFRESH_TOKEN_COOKIE_NAME, request, true);
  clearCookieVariants(response, LEGACY_AUTH_COOKIE_NAME, request, true);
  clearCookieVariants(response, AUTH_READY_COOKIE_NAME, request, false);
}
