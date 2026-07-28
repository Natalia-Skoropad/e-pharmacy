import assert from 'node:assert/strict';
import test from 'node:test';
import { NextRequest } from 'next/server';

import { ApiError } from '@e-pharmacy/api-client/transport';

import { localApiRequest } from '../../src/browser/local-api-request-core';
import { createPublicGetProxyRoute } from '../../src/proxy/route-factories';

//===================================================================

const originalFetch = globalThis.fetch;

//===================================================================

test('problem+json survives API-client → local request → BFF → backend flow', async () => {
  const previousEnvironment = {
    NODE_ENV: process.env.NODE_ENV,
    API_BASE_URL: process.env.API_BASE_URL,
    BFF_PROXY_SECRET: process.env.BFF_PROXY_SECRET,
  };

  process.env.NODE_ENV = 'test';
  process.env.API_BASE_URL = 'http://backend.example';
  process.env.BFF_PROXY_SECRET = 'shared-secret';

  const handler = createPublicGetProxyRoute({
    backendPath: '/problem',
    revalidate: false,
  });

  try {
    globalThis.fetch = async (input, init) => {
      const url = String(input);

      if (url === '/api/problem') {
        return handler(
          new NextRequest('https://client.example/api/problem', {
            method: init?.method,
            headers: init?.headers,
          }),
          { params: Promise.resolve({}) }
        );
      }

      assert.equal(url, 'http://backend.example/problem');
      return new Response(
        JSON.stringify({
          status: 'error',
          message: 'Conflict from backend',
          code: 'BACKEND_CONFLICT',
          requestId: 'backend-request',
        }),
        {
          status: 409,
          headers: { 'content-type': 'application/problem+json; charset=utf-8' },
        }
      );
    };

    await assert.rejects(
      localApiRequest('/api/problem', { retry: false }),
      (error: unknown) =>
        error instanceof ApiError &&
        error.httpStatus === 409 &&
        error.backendCode === 'BACKEND_CONFLICT' &&
        error.requestId === 'backend-request'
    );
  } finally {
    globalThis.fetch = originalFetch;

    for (const [key, value] of Object.entries(previousEnvironment)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});
