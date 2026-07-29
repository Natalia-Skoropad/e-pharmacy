import type { NextRequest, NextResponse } from 'next/server';

import {
  ACCESS_TOKEN_COOKIE_NAME,
  AUTH_READY_COOKIE_NAME,
  LEGACY_AUTH_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_NAME,
} from '@e-pharmacy/config/auth';

import type { AuthProxyTokens } from './auth-tokens';
import { getNextApiServerEnvironment } from './env';

//===================================================================

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
    maxAge: tokens.accessTokenExpiresIn,
  });

  response.cookies.set(REFRESH_TOKEN_COOKIE_NAME, tokens.refreshToken, {
    ...baseOptions,
    maxAge: tokens.refreshTokenExpiresIn,
  });

  response.cookies.set(AUTH_READY_COOKIE_NAME, '1', {
    ...getAuthHintCookieOptions(request),
    maxAge: tokens.refreshTokenExpiresIn,
  });
}

//===================================================================

function serializeExpiredCookie(
  name: string,
  request: NextRequest,
  httpOnly: boolean,
  domain?: string
): string {
  const configured = getAuthCookieBaseOptions(request);

  const attributes = [
    `${name}=`,
    'Path=/',
    'Max-Age=0',
    'Expires=Thu, 01 Jan 1970 00:00:00 GMT',
    ...(domain ? [`Domain=${domain}`] : []),
    ...(configured.secure ? ['Secure'] : []),
    ...(httpOnly ? ['HttpOnly'] : []),
    `SameSite=${configured.sameSite}`,
  ];

  return attributes.join('; ');
}

//===================================================================

function clearCookieVariant(
  response: NextResponse,
  name: string,
  request: NextRequest,
  httpOnly: boolean,
  domain?: string
): void {
  // ResponseCookies replaces cookies that share a name and path, even when
  // their domains differ. Append the raw headers so host-only, current-domain,
  // and legacy-domain variants are all expired in the same response.
  response.headers.append(
    'set-cookie',
    serializeExpiredCookie(name, request, httpOnly, domain)
  );
}

//===================================================================

function clearCookieVariants(
  response: NextResponse,
  name: string,
  request: NextRequest,
  httpOnly: boolean
): void {
  const environment = getNextApiServerEnvironment();

  const domains = [
    undefined,
    environment.authCookieDomain,
    ...environment.authCookieLegacyDomains,
  ];

  Array.from(new Set(domains)).forEach((domain) => {
    clearCookieVariant(response, name, request, httpOnly, domain);
  });
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
