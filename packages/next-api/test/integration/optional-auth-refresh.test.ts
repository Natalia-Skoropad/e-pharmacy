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

function createRequest({
  withAccess = true,
  withRefresh = true,
}: {
  withAccess?: boolean;
  withRefresh?: boolean;
} = {}): NextRequest {
  const cookies = [
    ...(withAccess ? [`${ACCESS_TOKEN_COOKIE_NAME}=expired-access`] : []),
    ...(withRefresh ? [`${REFRESH_TOKEN_COOKIE_NAME}=refresh-token`] : []),
    'analytics=drop-me',
  ].join('; ');

  return new NextRequest(
    'https://client.example/api/products/507f1f77bcf86cd799439011',
    { headers: cookies ? { cookie: cookies } : undefined }
  );
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

function expiredAccessResponse(): Response {
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

test('expired access + valid refresh returns personalized optional data', async () => {
  const restore = configureEnvironment();
  let anonymousCalls = 0;
  let refreshCalls = 0;
  let detailCalls = 0;

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

      detailCalls += 1;

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

      return expiredAccessResponse();
    };

    const response = await proxyOptionalAuthBackendRequest({
      backendPath: '/products/507f1f77bcf86cd799439011',
      request: createRequest(),
      requestId: 'optional-refresh-success',
      policy: 'refresh-aware',
    });

    assert.equal(response.status, 200);
    assert.equal(refreshCalls, 1);
    assert.equal(detailCalls, 2);
    assert.equal(anonymousCalls, 0);
    assert.equal((await response.json()).data.isFavorite, true);
    assert.match(response.headers.get('set-cookie') ?? '', /new-access/);
  } finally {
    restore();
  }
});

//===================================================================

test('missing access + valid refresh pre-refreshes before optional detail read', async () => {
  const restore = configureEnvironment();
  const calls: string[] = [];

  try {
    globalThis.fetch = async (input, init) => {
      const url = String(input);
      const cookie = new Headers(init?.headers).get('cookie') ?? '';
      calls.push(`${url}|${cookie}`);

      if (url.endsWith('/auth/refresh')) {
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

      assert.equal(cookie, `${ACCESS_TOKEN_COOKIE_NAME}=new-access`);
      return json({
        status: 'success',
        data: { id: 'product', isFavorite: true },
      });
    };

    const response = await proxyOptionalAuthBackendRequest({
      backendPath: '/products/507f1f77bcf86cd799439011',
      request: createRequest({ withAccess: false }),
      requestId: 'optional-pre-refresh-success',
      policy: 'refresh-aware',
    });

    assert.equal(response.status, 200);
    assert.equal((await response.json()).data.isFavorite, true);
    assert.equal(calls.length, 2);
    assert.match(calls[0] ?? '', /\/auth\/refresh/);
    assert.doesNotMatch(calls[0] ?? '', /analytics=drop-me/);
    assert.match(calls[1] ?? '', /new-access/);
  } finally {
    restore();
  }
});

//===================================================================

test('invalid refresh clears cookies and falls back to public data', async () => {
  const restore = configureEnvironment();
  let anonymousCalls = 0;

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

      if (!cookie) {
        anonymousCalls += 1;
        return json({ status: 'success', data: { isFavorite: false } });
      }

      return expiredAccessResponse();
    };

    const response = await proxyOptionalAuthBackendRequest({
      backendPath: '/products/507f1f77bcf86cd799439011',
      request: createRequest(),
      requestId: 'optional-refresh-invalid',
      policy: 'refresh-aware',
    });

    assert.equal(response.status, 200);
    assert.equal(anonymousCalls, 1);
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
        ? expiredAccessResponse()
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
        ? expiredAccessResponse()
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

test('missing refresh cookie clears stale access state before public fallback', async () => {
  const restore = configureEnvironment();

  try {
    globalThis.fetch = async (_input, init) => {
      const cookie = new Headers(init?.headers).get('cookie') ?? '';

      return cookie
        ? expiredAccessResponse()
        : json({ status: 'success', data: { isFavorite: false } });
    };

    const response = await proxyOptionalAuthBackendRequest({
      backendPath: '/products/507f1f77bcf86cd799439011',
      request: createRequest({ withRefresh: false }),
      requestId: 'optional-no-refresh',
      policy: 'refresh-aware',
    });

    assert.equal(response.status, 200);
    assert.match(response.headers.get('set-cookie') ?? '', /Max-Age=0/);
  } finally {
    restore();
  }
});

//===================================================================

test('no auth cookies performs exactly one anonymous detail request', async () => {
  const restore = configureEnvironment();
  let calls = 0;

  try {
    globalThis.fetch = async (_input, init) => {
      calls += 1;
      assert.equal(new Headers(init?.headers).get('cookie'), null);
      return json({ status: 'success', data: { isFavorite: false } });
    };

    const response = await proxyOptionalAuthBackendRequest({
      backendPath: '/products/507f1f77bcf86cd799439011',
      request: createRequest({ withAccess: false, withRefresh: false }),
      requestId: 'optional-anonymous',
      policy: 'refresh-aware',
    });

    assert.equal(response.status, 200);
    assert.equal(calls, 1);
  } finally {
    restore();
  }
});
