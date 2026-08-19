import assert from 'node:assert/strict';
import test from 'node:test';
import { NextRequest } from 'next/server';

import { proxyPublicBackendRequest } from '../../src/proxy/public-backend-proxy.ts';

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
  return new NextRequest('https://client.example/api/products');
}

//===================================================================

test('wrong 2xx envelope becomes 502 and is never public-cacheable', async () => {
  const restore = configureEnvironment();
  let calls = 0;

  try {
    globalThis.fetch = async () => {
      calls += 1;
      return new Response(JSON.stringify({ unexpected: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    };

    const response = await proxyPublicBackendRequest({
      request: request(),
      requestId: 'wrong-envelope',
      backendPath: '/products',
      revalidate: 600,
      staleWhileRevalidate: 600,
    });

    assert.equal(response.status, 502);
    assert.equal(calls, 1);
    assert.match(response.headers.get('cache-control') ?? '', /no-store/);
  } finally {
    restore();
  }
});

//===================================================================

test('malformed JSON and HTML success responses become controlled 502 responses', async () => {
  const restore = configureEnvironment();

  try {
    for (const upstream of [
      new Response('{', {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
      new Response('<html>gateway</html>', {
        status: 200,
        headers: { 'content-type': 'text/html' },
      }),
    ]) {
      globalThis.fetch = async () => upstream.clone();

      const response = await proxyPublicBackendRequest({
        request: request(),
        requestId: 'malformed-public-response',
        backendPath: '/products',
        revalidate: 30,
      });

      assert.equal(response.status, 502);
      assert.match(response.headers.get('cache-control') ?? '', /no-store/);
    }
  } finally {
    restore();
  }
});

//===================================================================

test('canonical 503 error envelope preserves status and no-store policy', async () => {
  const restore = configureEnvironment();

  try {
    globalThis.fetch = async () =>
      new Response(
        JSON.stringify({
          status: 'error',
          message: 'Service unavailable',
          code: 'SERVICE_UNAVAILABLE',
        }),
        {
          status: 503,
          headers: { 'content-type': 'application/json' },
        }
      );

    const response = await proxyPublicBackendRequest({
      request: request(),
      requestId: 'canonical-503',
      backendPath: '/products',
      revalidate: 30,
    });

    assert.equal(response.status, 503);
    assert.match(response.headers.get('cache-control') ?? '', /no-store/);
  } finally {
    restore();
  }
});
