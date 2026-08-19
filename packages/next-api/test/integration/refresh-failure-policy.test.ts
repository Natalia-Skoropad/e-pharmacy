import assert from 'node:assert/strict';
import test from 'node:test';
import { NextRequest } from 'next/server';

import {
  ACCESS_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_NAME,
} from '@e-pharmacy/config/auth';

import { proxyBackendRequest } from '../../src/proxy/backend-proxy.ts';

//===================================================================

const originalFetch = globalThis.fetch;

//===================================================================

function configureEnvironment(): () => void {
  const previous = { ...process.env };
  process.env.NODE_ENV = 'test';
  process.env.API_BASE_URL = 'http://backend.example';
  process.env.BFF_PROXY_SECRET = 'shared-secret';

  return () => {
    globalThis.fetch = originalFetch;
    for (const key of Object.keys(process.env)) {
      if (!(key in previous)) delete process.env[key];
    }
    Object.assign(process.env, previous);
  };
}

//===================================================================

function request(method: 'GET' | 'PATCH' = 'GET'): NextRequest {
  return new NextRequest('https://client.example/api/orders', {
    method,
    headers: {
      cookie: `${ACCESS_TOKEN_COOKIE_NAME}=expired; ${REFRESH_TOKEN_COOKIE_NAME}=refresh`,
      ...(method === 'PATCH' ? { 'content-type': 'application/json' } : {}),
    },
    ...(method === 'PATCH'
      ? { body: JSON.stringify({ currentPassword: 'wrong-password' }) }
      : {}),
  });
}

//===================================================================

function json(payload: unknown, status: number): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

//===================================================================

function expiredAccess(): Response {
  return json(
    {
      status: 'error',
      message: 'Expired access',
      code: 'AUTH_SESSION_INVALID',
    },
    401
  );
}

//===================================================================

test('clears cookies after invalid refresh credentials', async () => {
  const restore = configureEnvironment();

  try {
    globalThis.fetch = async (input) =>
      String(input).endsWith('/auth/refresh')
        ? json(
            {
              status: 'error',
              message: 'Invalid refresh',
              code: 'AUTH_SESSION_INVALID',
            },
            401
          )
        : expiredAccess();

    const response = await proxyBackendRequest({
      request: request(),
      requestId: 'invalid-refresh',
      backendPath: '/orders',
    });

    assert.equal(response.status, 401);
    assert.match(response.headers.get('set-cookie') ?? '', /Max-Age=0/);
  } finally {
    restore();
  }
});

//===================================================================

test('temporary refresh transport outage does not destroy browser cookies', async () => {
  const restore = configureEnvironment();

  try {
    globalThis.fetch = async (input) => {
      if (String(input).endsWith('/auth/refresh')) {
        throw new TypeError('temporary network outage');
      }
      return expiredAccess();
    };

    const response = await proxyBackendRequest({
      request: request(),
      requestId: 'refresh-outage',
      backendPath: '/orders',
    });

    assert.equal(response.status, 502);
    assert.equal(response.headers.get('set-cookie'), null);
  } finally {
    restore();
  }
});

//===================================================================

test('AUTH_INVALID_CREDENTIALS 401 never triggers refresh or mutation replay', async () => {
  const restore = configureEnvironment();
  let passwordCalls = 0;
  let refreshCalls = 0;

  try {
    globalThis.fetch = async (input) => {
      if (String(input).endsWith('/auth/refresh')) {
        refreshCalls += 1;
        return json({ status: 'success' }, 200);
      }

      passwordCalls += 1;
      return json(
        {
          status: 'error',
          message: 'Current password is incorrect',
          code: 'AUTH_INVALID_CREDENTIALS',
        },
        401
      );
    };

    const response = await proxyBackendRequest({
      request: request('PATCH'),
      requestId: 'business-401-no-refresh',
      backendPath: '/auth/current/password',
      method: 'PATCH',
    });

    assert.equal(response.status, 401);
    assert.equal(passwordCalls, 1);
    assert.equal(refreshCalls, 0);
    assert.equal(response.headers.get('set-cookie'), null);
  } finally {
    restore();
  }
});

//===================================================================

test('AUTH_SESSION_INVALID refreshes and retries the protected request once', async () => {
  const restore = configureEnvironment();
  let protectedCalls = 0;
  let refreshCalls = 0;

  try {
    globalThis.fetch = async (input, init) => {
      if (String(input).endsWith('/auth/refresh')) {
        refreshCalls += 1;
        return json(
          {
            status: 'success',
            data: {
              tokens: {
                accessToken: 'new-access',
                refreshToken: 'new-refresh',
                accessTokenExpiresIn: 900,
                refreshTokenExpiresIn: 2_592_000,
              },
            },
          },
          200
        );
      }

      protectedCalls += 1;
      const cookie = new Headers(init?.headers).get('cookie') ?? '';
      return cookie.includes('new-access')
        ? json({ status: 'success', data: { ok: true } }, 200)
        : expiredAccess();
    };

    const response = await proxyBackendRequest({
      request: request(),
      requestId: 'session-refresh-retry',
      backendPath: '/orders',
    });

    assert.equal(response.status, 200);
    assert.equal(refreshCalls, 1);
    assert.equal(protectedCalls, 2);
    assert.match(response.headers.get('set-cookie') ?? '', /new-access/);
  } finally {
    restore();
  }
});

//===================================================================

test('AUTH_USER_BLOCKED clears cookies without refresh or replay', async () => {
  const restore = configureEnvironment();
  let protectedCalls = 0;
  let refreshCalls = 0;

  try {
    globalThis.fetch = async (input) => {
      if (String(input).endsWith('/auth/refresh')) {
        refreshCalls += 1;
        return json({ status: 'success' }, 200);
      }

      protectedCalls += 1;
      return json(
        {
          status: 'error',
          message: 'User is blocked',
          code: 'AUTH_USER_BLOCKED',
        },
        403
      );
    };

    const response = await proxyBackendRequest({
      request: request(),
      requestId: 'blocked-no-refresh',
      backendPath: '/orders',
    });

    assert.equal(response.status, 403);
    assert.equal(protectedCalls, 1);
    assert.equal(refreshCalls, 0);
    assert.match(response.headers.get('set-cookie') ?? '', /Max-Age=0/);
  } finally {
    restore();
  }
});
