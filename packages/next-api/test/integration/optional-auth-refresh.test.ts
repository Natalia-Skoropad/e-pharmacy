import assert from 'node:assert/strict';
import test from 'node:test';
import { NextRequest } from 'next/server';

import {
  ACCESS_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_NAME,
} from '@e-pharmacy/config/auth';

import { proxyOptionalAuthBackendRequest } from '../../src/proxy/optional-auth-backend-proxy.ts';

//===================================================================

const originalFetch = globalThis.fetch;

//===================================================================

function json(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

//===================================================================

function createRequest(withRefresh = true): NextRequest {
  const cookies = [
    `${ACCESS_TOKEN_COOKIE_NAME}=expired-access`,
    ...(withRefresh ? [`${REFRESH_TOKEN_COOKIE_NAME}=refresh-token`] : []),
    'analytics=drop-me',
  ].join('; ');

  return new NextRequest('https://client.example/api/products/507f1f77bcf86cd799439011', {
    headers: { cookie: cookies },
  });
}

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

test('refresh-aware optional auth refreshes before preserving user-specific data', async () => {
  const restore = configureEnvironment();
  let anonymousCalls = 0;
  let refreshCalls = 0;

  try {
    globalThis.fetch = async (input, init) => {
      const url = String(input);
      const cookie = new Headers(init?.headers).get('cookie') ?? '';

      if (url.endsWith('/auth/refresh')) {
        refreshCalls += 1;
        assert.equal(cookie, `${REFRESH_TOKEN_COOKIE_NAME}=refresh-token`);

        return json({
          status: 'success',
          data: {
            tokens: {
              accessToken: 'new-access',
              refreshToken: 'new-refresh',
              accessTokenExpiresIn: 900,
              refreshTokenExpiresIn: 2_592_000,
            },
          },
        });
      }

      if (cookie === `${ACCESS_TOKEN_COOKIE_NAME}=new-access`) {
        return json({
          status: 'success',
          data: { id: 'product', isFavorite: true },
        });
      }

      if (!cookie) {
        anonymousCalls += 1;
        return json({
          status: 'success',
          data: { id: 'product', isFavorite: false },
        });
      }

      return json({ status: 'error', message: 'Expired' }, 401);
    };

    const response = await proxyOptionalAuthBackendRequest({
      backendPath: '/products/507f1f77bcf86cd799439011',
      request: createRequest(),
      requestId: 'optional-refresh-success',
      policy: 'refresh-aware',
    });

    assert.equal(response.status, 200);
    assert.equal(refreshCalls, 1);
    assert.equal(anonymousCalls, 0);
    assert.equal((await response.json()).data.isFavorite, true);
    assert.match(response.headers.get('set-cookie') ?? '', /new-access/);
  } finally {
    restore();
  }
});

//===================================================================

test('invalid refresh clears cookies and falls back to public data', async () => {
  const restore = configureEnvironment();

  try {
    globalThis.fetch = async (input, init) => {
      const url = String(input);
      const cookie = new Headers(init?.headers).get('cookie') ?? '';

      if (url.endsWith('/auth/refresh')) {
        return json(
          {
            status: 'error',
            message: 'Invalid refresh',
            code: 'AUTH_SESSION_INVALID',
          },
          401
        );
      }

      return cookie
        ? json({ status: 'error', message: 'Expired' }, 401)
        : json({ status: 'success', data: { isFavorite: false } });
    };

    const response = await proxyOptionalAuthBackendRequest({
      backendPath: '/products/507f1f77bcf86cd799439011',
      request: createRequest(),
      requestId: 'optional-refresh-invalid',
      policy: 'refresh-aware',
    });

    assert.equal(response.status, 200);
    assert.equal((await response.json()).data.isFavorite, false);
    assert.match(response.headers.get('set-cookie') ?? '', /Max-Age=0/);
  } finally {
    restore();
  }
});

//===================================================================

test('malformed refresh response clears cookies before public fallback', async () => {
  const restore = configureEnvironment();

  try {
    globalThis.fetch = async (input, init) => {
      const url = String(input);
      const cookie = new Headers(init?.headers).get('cookie') ?? '';

      if (url.endsWith('/auth/refresh')) {
        return new Response('<html>broken gateway</html>', {
          status: 200,
          headers: { 'content-type': 'text/html' },
        });
      }

      return cookie
        ? json({ status: 'error', message: 'Expired' }, 401)
        : json({ status: 'success', data: { isFavorite: false } });
    };

    const response = await proxyOptionalAuthBackendRequest({
      backendPath: '/products/507f1f77bcf86cd799439011',
      request: createRequest(),
      requestId: 'optional-refresh-malformed',
      policy: 'refresh-aware',
    });

    assert.equal(response.status, 200);
    assert.match(response.headers.get('set-cookie') ?? '', /Max-Age=0/);
  } finally {
    restore();
  }
});

//===================================================================

test('temporary refresh outage preserves cookies and falls back to public data', async () => {
  const restore = configureEnvironment();

  try {
    globalThis.fetch = async (input, init) => {
      const url = String(input);
      const cookie = new Headers(init?.headers).get('cookie') ?? '';

      if (url.endsWith('/auth/refresh')) {
        throw new TypeError('temporary outage');
      }

      return cookie
        ? json({ status: 'error', message: 'Expired' }, 401)
        : json({ status: 'success', data: { isFavorite: false } });
    };

    const response = await proxyOptionalAuthBackendRequest({
      backendPath: '/products/507f1f77bcf86cd799439011',
      request: createRequest(),
      requestId: 'optional-refresh-outage',
      policy: 'refresh-aware',
    });

    assert.equal(response.status, 200);
    assert.equal(response.headers.get('set-cookie'), null);
  } finally {
    restore();
  }
});

//===================================================================

test('missing refresh cookie clears stale auth state before public fallback', async () => {
  const restore = configureEnvironment();

  try {
    globalThis.fetch = async (_input, init) => {
      const cookie = new Headers(init?.headers).get('cookie') ?? '';

      return cookie
        ? json({ status: 'error', message: 'Expired' }, 401)
        : json({ status: 'success', data: { isFavorite: false } });
    };

    const response = await proxyOptionalAuthBackendRequest({
      backendPath: '/products/507f1f77bcf86cd799439011',
      request: createRequest(false),
      requestId: 'optional-no-refresh',
      policy: 'refresh-aware',
    });

    assert.equal(response.status, 200);
    assert.match(response.headers.get('set-cookie') ?? '', /Max-Age=0/);
  } finally {
    restore();
  }
});
