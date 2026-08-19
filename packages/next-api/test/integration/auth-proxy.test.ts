import assert from 'node:assert/strict';
import test from 'node:test';
import { NextRequest } from 'next/server';

import { authRoutes } from '@e-pharmacy/api-client/contracts';

import {
  ACCESS_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_NAME,
} from '@e-pharmacy/config/auth';

import { proxyAuthRequest } from '../../src/proxy/auth-proxy.ts';

//===================================================================

const originalFetch = globalThis.fetch;

//===================================================================

function createAuthRequest(path: string): NextRequest {
  return new NextRequest(`https://client.example/api/auth/${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'user@example.com', password: 'secret' }),
  });
}

//===================================================================

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

//===================================================================

function configureTestEnvironment(): () => void {
  const previous = {
    NODE_ENV: process.env.NODE_ENV,
    API_BASE_URL: process.env.API_BASE_URL,
    BFF_PROXY_SECRET: process.env.BFF_PROXY_SECRET,
  };

  process.env.NODE_ENV = 'test';
  process.env.API_BASE_URL = 'http://backend.example';
  process.env.BFF_PROXY_SECRET = 'shared-secret';

  return () => {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    globalThis.fetch = originalFetch;
  };
}

//===================================================================

test('login/register/refresh strip valid tokens and set httpOnly cookies', async () => {
  const restore = configureTestEnvironment();

  try {
    for (const [name, backendPath] of Object.entries({
      login: authRoutes.login,
      register: authRoutes.register,
      refresh: authRoutes.refresh,
    })) {
      globalThis.fetch = async () =>
        jsonResponse({
          status: 'success',
          data: {
            user: { id: '507f1f77bcf86cd799439011' },
            tokens: {
              accessToken: `${name}-access`,
              refreshToken: `${name}-refresh`,
              accessTokenExpiresIn: 900,
              refreshTokenExpiresIn: 2_592_000,
            },
          },
        });

      const response = await proxyAuthRequest({
        request: createAuthRequest(name),
        requestId: `${name}-request`,
        backendPath,
        markerAction: 'set',
        authCookieMode: name === 'refresh' ? 'refresh-only' : 'none',
      });

      assert.equal(response.status, 200);
      const payload = (await response.json()) as {
        data?: Record<string, unknown>;
      };
      assert.equal(payload.data?.tokens, undefined);

      const setCookie = response.headers.get('set-cookie') ?? '';
      assert.match(setCookie, new RegExp(ACCESS_TOKEN_COOKIE_NAME));
      assert.match(setCookie, new RegExp(REFRESH_TOKEN_COOKIE_NAME));
      assert.match(setCookie, /Max-Age=900/);
      assert.match(setCookie, /Max-Age=2592000/);
      assert.doesNotMatch(JSON.stringify(payload), /accessToken|refreshToken/);
    }
  } finally {
    restore();
  }
});

//===================================================================

test('secret mismatch or missing/malformed tokens becomes a controlled 502', async () => {
  const restore = configureTestEnvironment();

  try {
    const backendBodies = [
      { status: 'success', data: { user: { id: 'user' } } },
      {
        status: 'success',
        data: { tokens: { accessToken: 123, refreshToken: {} } },
      },
    ];

    for (const body of backendBodies) {
      globalThis.fetch = async () => jsonResponse(body);

      const response = await proxyAuthRequest({
        request: createAuthRequest('login'),
        requestId: 'invalid-auth-response',
        backendPath: authRoutes.login,
        markerAction: 'set',
        authCookieMode: 'none',
      });

      assert.equal(response.status, 502);

      const payload = (await response.json()) as {
        status: string;
        code: string;
      };

      assert.equal(payload.status, 'error');
      assert.equal(payload.code, 'INVALID_BACKEND_RESPONSE');
      assert.doesNotMatch(response.headers.get('set-cookie') ?? '', /access=/);
    }
  } finally {
    restore();
  }
});

//===================================================================

test('password reset cleanup clears cookies only after a successful reset', async () => {
  const restore = configureTestEnvironment();

  const resetRequest = () =>
    new NextRequest('https://client.example/api/auth/password-reset/confirm', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: `${ACCESS_TOKEN_COOKIE_NAME}=access; ${REFRESH_TOKEN_COOKIE_NAME}=refresh`,
      },
      body: JSON.stringify({ token: 'token', password: 'NewPassword1!' }),
    });

  try {
    globalThis.fetch = async () =>
      jsonResponse({ status: 'success', message: 'Password reset' });

    const success = await proxyAuthRequest({
      request: resetRequest(),
      requestId: 'reset-success',
      backendPath: authRoutes.passwordResetConfirm,
      cookieCleanup: 'on-success',
      authCookieMode: 'none',
    });

    assert.equal(success.status, 200);
    assert.match(success.headers.get('set-cookie') ?? '', /Max-Age=0/);

    for (const [name, backendResponse] of [
      [
        'invalid-token',
        jsonResponse(
          {
            status: 'error',
            message: 'Invalid reset token',
            code: 'AUTH_RESET_TOKEN_INVALID',
          },
          400
        ),
      ],
      [
        'expired-token',
        jsonResponse(
          {
            status: 'error',
            message: 'Reset token has expired',
            code: 'AUTH_RESET_TOKEN_INVALID',
          },
          400
        ),
      ],
      [
        'validation',
        jsonResponse(
          {
            status: 'error',
            message: 'Validation failed',
            code: 'AUTH_VALIDATION_FAILED',
          },
          400
        ),
      ],
      [
        'backend-error',
        jsonResponse(
          {
            status: 'error',
            message: 'Service unavailable',
            code: 'AUTH_SERVICE_UNAVAILABLE',
          },
          500
        ),
      ],
    ] as const) {
      globalThis.fetch = async () => backendResponse.clone();

      const response = await proxyAuthRequest({
        request: resetRequest(),
        requestId: `reset-${name}`,
        backendPath: authRoutes.passwordResetConfirm,
        cookieCleanup: 'on-success',
        authCookieMode: 'none',
      });

      assert.equal(
        response.headers.get('set-cookie'),
        null,
        `${name} must preserve the current browser session`
      );
    }

    globalThis.fetch = async () => {
      throw new TypeError('temporary network outage');
    };

    const outage = await proxyAuthRequest({
      request: resetRequest(),
      requestId: 'reset-outage',
      backendPath: authRoutes.passwordResetConfirm,
      cookieCleanup: 'on-success',
      authCookieMode: 'none',
    });

    assert.equal(outage.status, 502);
    assert.equal(outage.headers.get('set-cookie'), null);

    globalThis.fetch = async () => {
      throw new DOMException('The operation timed out.', 'TimeoutError');
    };

    const timeout = await proxyAuthRequest({
      request: resetRequest(),
      requestId: 'reset-timeout',
      backendPath: authRoutes.passwordResetConfirm,
      cookieCleanup: 'on-success',
      authCookieMode: 'none',
    });

    assert.equal(timeout.status, 504);
    assert.equal(timeout.headers.get('set-cookie'), null);
  } finally {
    restore();
  }
});

//===================================================================

test('logout cleanup remains unconditional when backend transport fails', async () => {
  const restore = configureTestEnvironment();

  try {
    globalThis.fetch = async () => {
      throw new TypeError('temporary network outage');
    };

    const response = await proxyAuthRequest({
      request: new NextRequest('https://client.example/api/auth/logout', {
        method: 'POST',
        headers: {
          cookie: `${ACCESS_TOKEN_COOKIE_NAME}=access; ${REFRESH_TOKEN_COOKIE_NAME}=refresh`,
        },
      }),
      requestId: 'logout-outage',
      backendPath: authRoutes.logout,
      cookieCleanup: 'always',
      authCookieMode: 'refresh-only',
    });

    assert.equal(response.status, 502);
    assert.match(response.headers.get('set-cookie') ?? '', /Max-Age=0/);
  } finally {
    restore();
  }
});

//===================================================================

test('auth proxy rejects oversized login JSON before any backend request', async () => {
  const restore = configureTestEnvironment();
  let backendCalls = 0;

  try {
    globalThis.fetch = async () => {
      backendCalls += 1;
      return jsonResponse({ status: 'success' });
    };

    const response = await proxyAuthRequest({
      request: new NextRequest('https://client.example/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: 'user@example.com',
          password: 'x'.repeat(70 * 1024),
        }),
      }),
      requestId: 'oversized-login',
      backendPath: authRoutes.login,
      markerAction: 'set',
      authCookieMode: 'none',
    });

    assert.equal(response.status, 413);
    assert.equal(backendCalls, 0);
  } finally {
    restore();
  }
});
