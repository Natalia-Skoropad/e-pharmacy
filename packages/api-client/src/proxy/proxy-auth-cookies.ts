import { type NextRequest, type NextResponse } from 'next/server';

import {
  ACCESS_TOKEN_COOKIE_NAME,
  AUTH_COOKIE_MAX_AGE_SECONDS,
  AUTH_READY_COOKIE_NAME,
  LEGACY_AUTH_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_NAME,
} from '@e-pharmacy/config/auth';

//===================================================================

export type AuthProxyTokens = {
  accessToken?: string;
  refreshToken?: string;
};

type ApiResponseWithTokens = {
  data?: {
    tokens?: AuthProxyTokens;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

//===================================================================

const ACCESS_TOKEN_MAX_AGE_SECONDS = 15 * 60;
const AUTH_TOKEN_RESPONSE_FIELD = 'tokens';

//===================================================================

function isSecureRequest(request: NextRequest): boolean {
  return request.nextUrl.protocol === 'https:';
}

//===================================================================

function getAuthCookieBaseOptions(request: NextRequest) {
  return {
    httpOnly: true,
    path: '/',
    sameSite: 'lax' as const,
    secure: isSecureRequest(request),
  };
}

//===================================================================

export function setClientAuthCookies(
  response: NextResponse,
  request: NextRequest,
  tokens: AuthProxyTokens
): void {
  const baseOptions = getAuthCookieBaseOptions(request);

  if (tokens.accessToken) {
    response.cookies.set(ACCESS_TOKEN_COOKIE_NAME, tokens.accessToken, {
      ...baseOptions,
      maxAge: ACCESS_TOKEN_MAX_AGE_SECONDS,
    });
  }

  if (tokens.refreshToken) {
    response.cookies.set(REFRESH_TOKEN_COOKIE_NAME, tokens.refreshToken, {
      ...baseOptions,
      maxAge: AUTH_COOKIE_MAX_AGE_SECONDS,
    });
  }

  if (tokens.accessToken || tokens.refreshToken) {
    response.cookies.set(AUTH_READY_COOKIE_NAME, '1', {
      path: '/',
      maxAge: AUTH_COOKIE_MAX_AGE_SECONDS,
      sameSite: 'lax',
      secure: isSecureRequest(request),
    });
  }
}

//===================================================================

export function clearClientAuthCookies(
  response: NextResponse,
  request: NextRequest
): void {
  const cookieOptions = {
    path: '/',
    maxAge: 0,
    sameSite: 'lax' as const,
    secure: isSecureRequest(request),
  };

  response.cookies.set(ACCESS_TOKEN_COOKIE_NAME, '', cookieOptions);
  response.cookies.set(REFRESH_TOKEN_COOKIE_NAME, '', cookieOptions);
  response.cookies.set(LEGACY_AUTH_COOKIE_NAME, '', cookieOptions);
  response.cookies.set(AUTH_READY_COOKIE_NAME, '', cookieOptions);
}

//===================================================================

export function extractTokensFromResponseBody(body: string): {
  body: string;
  tokens: AuthProxyTokens;
} {
  if (!body) return { body, tokens: {} };

  try {
    const parsed = JSON.parse(body) as ApiResponseWithTokens;
    const tokens = parsed.data?.tokens ?? {};

    if (parsed.data && AUTH_TOKEN_RESPONSE_FIELD in parsed.data) {
      const { tokens: _tokens, ...safeData } = parsed.data;

      void _tokens;

      parsed.data = safeData;
    }

    return {
      body: JSON.stringify(parsed),
      tokens,
    };
  } catch {
    return { body, tokens: {} };
  }
}

//===================================================================

export function createCookieHeaderWithTokens(
  request: NextRequest,
  tokens: AuthProxyTokens
): string | undefined {
  const cookies = new Map<string, string>();
  const cookieHeader = request.headers.get('cookie') ?? '';

  cookieHeader
    .split(';')
    .map((cookie) => cookie.trim())
    .filter(Boolean)
    .forEach((cookie) => {
      const [name, ...valueParts] = cookie.split('=');
      const value = valueParts.join('=');

      if (!name || !value) return;

      cookies.set(name, value);
    });

  if (tokens.accessToken) {
    cookies.set(ACCESS_TOKEN_COOKIE_NAME, tokens.accessToken);
  }

  if (tokens.refreshToken) {
    cookies.set(REFRESH_TOKEN_COOKIE_NAME, tokens.refreshToken);
  }

  const nextCookieHeader = Array.from(cookies.entries())
    .map(([name, value]) => `${name}=${value}`)
    .join('; ');

  return nextCookieHeader || undefined;
}
