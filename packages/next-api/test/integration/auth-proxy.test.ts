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
