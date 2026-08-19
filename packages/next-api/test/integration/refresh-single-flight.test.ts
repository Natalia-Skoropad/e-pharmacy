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

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

//===================================================================

function createPrivateRequest(): NextRequest {
  return new NextRequest('https://client.example/api/private-resource', {
    headers: {
      cookie: `${ACCESS_TOKEN_COOKIE_NAME}=expired; ${REFRESH_TOKEN_COOKIE_NAME}=shared-refresh; analytics=drop-me`,
    },
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

test('concurrent private requests share one refresh call', async () => {
  const restore = configureTestEnvironment();
  let refreshCalls = 0;

  try {
    globalThis.fetch = async (input, init) => {
      const url = String(input);
      const cookie = new Headers(init?.headers).get('cookie') ?? '';

      if (url.endsWith('/auth/refresh')) {
        refreshCalls += 1;
        assert.equal(cookie, `${REFRESH_TOKEN_COOKIE_NAME}=shared-refresh`);
        await new Promise((resolve) => setTimeout(resolve, 20));

        return jsonResponse({
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

      if (cookie.includes(`${ACCESS_TOKEN_COOKIE_NAME}=new-access`)) {
        assert.doesNotMatch(cookie, /analytics|shared-refresh/);
        return jsonResponse({ status: 'success', data: { value: 1 } });
      }

      return jsonResponse(
        {
          status: 'error',
          message: 'Expired',
          code: 'AUTH_SESSION_INVALID',
        },
        401
      );
    };

    const [first, second] = await Promise.all([
      proxyBackendRequest({
        request: createPrivateRequest(),
        requestId: 'request-a',
        backendPath: '/private-resource',
      }),

      proxyBackendRequest({
        request: createPrivateRequest(),
        requestId: 'request-b',
        backendPath: '/private-resource',
      }),
    ]);

    assert.equal(first.status, 200);
    assert.equal(second.status, 200);
    assert.equal(refreshCalls, 1);
  } finally {
    restore();
  }
});
