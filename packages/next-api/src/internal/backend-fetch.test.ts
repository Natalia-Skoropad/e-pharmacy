import assert from 'node:assert/strict';
import test from 'node:test';
import { NextRequest } from 'next/server';

import { executeBackendFetch } from './backend-fetch.ts';

//===================================================================

const originalFetch = globalThis.fetch;

//===================================================================

function configureEnvironment(): () => void {
  const previous = { ...process.env };
  process.env.NODE_ENV = 'test';
  process.env.API_BASE_URL = 'http://backend.example';
  process.env.BFF_PROXY_SECRET = 'test-secret';

  return () => {
    globalThis.fetch = originalFetch;
    for (const key of Object.keys(process.env)) {
      if (!(key in previous)) delete process.env[key];
    }
    Object.assign(process.env, previous);
  };
}

//===================================================================

test('forwards query parameters for every supported HTTP method and disables redirects', async () => {
  const restore = configureEnvironment();
  const calls: Array<{ url: string; init?: RequestInit }> = [];

  try {
    globalThis.fetch = async (input, init) => {
      calls.push({ url: String(input), init });
      return new Response(JSON.stringify({ status: 'success' }), {
        headers: { 'content-type': 'application/json' },
      });
    };

    for (const method of ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'] as const) {
      const request = new NextRequest(
        'https://client.example/api/example?tag=one&tag=two&name=%D0%90%D0%BF%D1%82%D0%B5%D0%BA%D0%B0',
        {
          method,
          ...(method === 'GET'
            ? {}
            : {
                headers: { 'content-type': 'application/json' },
                body: '{}',
              }),
        }
      );

      await executeBackendFetch({
        request,
        backendPath: '/resource?existing=yes',
        method,
        requestId: `request-${method}`,
        timeoutMs: 1_000,
        authCookieMode: 'none',
        body: method === 'GET' ? undefined : '{}',
      });
    }

    assert.equal(calls.length, 5);

    for (const call of calls) {
      assert.equal(
        call.url,
        'http://backend.example/resource?existing=yes&tag=one&tag=two&name=%D0%90%D0%BF%D1%82%D0%B5%D0%BA%D0%B0'
      );
      assert.equal(call.init?.redirect, 'manual');
    }
  } finally {
    restore();
  }
});
