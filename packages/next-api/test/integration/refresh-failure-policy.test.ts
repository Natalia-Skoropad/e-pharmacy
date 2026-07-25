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

function request(): NextRequest {
  return new NextRequest('https://client.example/api/orders', {
    headers: {
      cookie: `${ACCESS_TOKEN_COOKIE_NAME}=expired; ${REFRESH_TOKEN_COOKIE_NAME}=refresh`,
    },
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

test('clears cookies after invalid refresh credentials', async () => {
  const restore = configureEnvironment();

  try {
    globalThis.fetch = async (input) =>
      String(input).endsWith('/auth/refresh')
        ? json({ status: 'error', message: 'Invalid refresh' }, 401)
        : json({ status: 'error', message: 'Expired access' }, 401);

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
      return json({ status: 'error', message: 'Expired access' }, 401);
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
