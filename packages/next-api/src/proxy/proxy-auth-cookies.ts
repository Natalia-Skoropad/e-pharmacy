import 'server-only';
import { type NextRequest, type NextResponse } from 'next/server';

import {
  ACCESS_TOKEN_COOKIE_NAME,
  AUTH_READY_COOKIE_MAX_AGE_SECONDS,
  AUTH_READY_COOKIE_NAME,
  LEGACY_AUTH_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_MAX_AGE_SECONDS,
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

type ProxyCookieSameSite = 'lax' | 'strict' | 'none';

//===================================================================

type RuntimeEnvironment = {
  AUTH_COOKIE_DOMAIN?: string;
  AUTH_COOKIE_SAME_SITE?: string;
};

//===================================================================

function getRuntimeEnvironment(): RuntimeEnvironment {
  const runtime = globalThis as typeof globalThis & {
    process?: { env?: RuntimeEnvironment };
  };
  return runtime.process?.env ?? {};
}

//===================================================================

function getConfiguredSameSite(): ProxyCookieSameSite {
  const value = getRuntimeEnvironment().AUTH_COOKIE_SAME_SITE;
  return value === 'strict' || value === 'none' ? value : 'lax';
}

//===================================================================

function getAuthCookieBaseOptions(request: NextRequest) {
  const sameSite = getConfiguredSameSite();
  const domain = getRuntimeEnvironment().AUTH_COOKIE_DOMAIN || undefined;
  return {
    httpOnly: true,
    path: '/',
    sameSite,
    secure: isSecureRequest(request) || sameSite === 'none',
    ...(domain ? { domain } : {}),
  };
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

  if (tokens.accessToken) {
    response.cookies.set(ACCESS_TOKEN_COOKIE_NAME, tokens.accessToken, {
      ...baseOptions,
      maxAge: ACCESS_TOKEN_MAX_AGE_SECONDS,
    });
  }

  if (tokens.refreshToken) {
    response.cookies.set(REFRESH_TOKEN_COOKIE_NAME, tokens.refreshToken, {
      ...baseOptions,
      maxAge: REFRESH_TOKEN_COOKIE_MAX_AGE_SECONDS,
    });
  }

  if (tokens.accessToken || tokens.refreshToken) {
    response.cookies.set(AUTH_READY_COOKIE_NAME, '1', {
      ...getAuthHintCookieOptions(request),
      maxAge: AUTH_READY_COOKIE_MAX_AGE_SECONDS,
    });
  }
}

//===================================================================

export function clearClientAuthCookies(
  response: NextResponse,
  request: NextRequest
): void {
  const tokenCookieOptions = {
    ...getAuthCookieBaseOptions(request),
    maxAge: 0,
  };
  const hintCookieOptions = { ...getAuthHintCookieOptions(request), maxAge: 0 };

  response.cookies.set(ACCESS_TOKEN_COOKIE_NAME, '', tokenCookieOptions);
  response.cookies.set(REFRESH_TOKEN_COOKIE_NAME, '', tokenCookieOptions);
  response.cookies.set(LEGACY_AUTH_COOKIE_NAME, '', tokenCookieOptions);
  response.cookies.set(AUTH_READY_COOKIE_NAME, '', hintCookieOptions);
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
