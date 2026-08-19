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

//===================================================================

test('authenticated browser public reads never forward cookies or upstream Set-Cookie', async () => {
  const restore = configureEnvironment();

  try {
    globalThis.fetch = async (_input, init) => {
      const headers = new Headers(init?.headers);
      assert.equal(headers.get('cookie'), null);
      assert.equal(headers.get('authorization'), null);

      return new Response(
        JSON.stringify({ status: 'success', data: { items: [] } }),
        {
          status: 200,
          headers: {
            'content-type': 'application/json',
            'set-cookie': 'backend_session=must-not-reach-browser; HttpOnly',
          },
        }
      );
    };

    const response = await proxyPublicBackendRequest({
      request: new NextRequest('https://client.example/api/products', {
        headers: {
          cookie:
            'e_pharmacy_access_token=access; e_pharmacy_refresh_token=refresh; analytics=drop-me',
          authorization: 'Bearer browser-token',
        },
      }),

      requestId: 'public-auth-isolation',
      backendPath: '/products',
      revalidate: 30,
      staleWhileRevalidate: 30,
    });

    assert.equal(response.status, 200);
    assert.equal(response.headers.get('set-cookie'), null);
    assert.match(response.headers.get('cache-control') ?? '', /s-maxage=30/);
  } finally {
    restore();
  }
});
