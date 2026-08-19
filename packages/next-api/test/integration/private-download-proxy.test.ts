import assert from 'node:assert/strict';
import test from 'node:test';
import { NextRequest } from 'next/server';

import { ACCESS_TOKEN_COOKIE_NAME } from '@e-pharmacy/config/auth';

import { proxyPrivateBackendDownloadRequest } from '../../src/proxy/backend-proxy.ts';

//===================================================================

const originalFetch = globalThis.fetch;

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

test('private document download streams binary data with no-store and safe headers', async () => {
  const restore = configureEnvironment();

  try {
    globalThis.fetch = async (input, init) => {
      assert.equal(String(input), 'http://backend.example/pharmacies/me/documents/abc');
      const headers = new Headers(init?.headers);
      assert.equal(headers.get('cookie'), `${ACCESS_TOKEN_COOKIE_NAME}=access`);

      return new Response(new Uint8Array([1, 2, 3, 4]), {
        status: 200,
        headers: {
          'content-type': 'application/pdf',
          'content-length': '4',
          'content-disposition': "attachment; filename*=UTF-8''license.pdf",
          'set-cookie': 'backend_cookie=drop-me; HttpOnly',
        },
      });
    };

    const response = await proxyPrivateBackendDownloadRequest({
      request: new NextRequest(
        'https://pharmacy.example/api/pharmacies/me/documents/abc',
        { headers: { cookie: `${ACCESS_TOKEN_COOKIE_NAME}=access` } }
      ),
      requestId: 'download-request',
      backendPath: '/pharmacies/me/documents/abc',
    });

    assert.equal(response.status, 200);
    assert.equal(response.headers.get('content-type'), 'application/pdf');
    assert.equal(response.headers.get('content-length'), '4');
    assert.equal(
      response.headers.get('content-disposition'),
      "attachment; filename*=UTF-8''license.pdf"
    );
    assert.equal(response.headers.get('set-cookie'), null);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.equal(response.headers.get('x-request-id'), 'download-request');
    assert.deepEqual(
      new Uint8Array(await response.arrayBuffer()),
      new Uint8Array([1, 2, 3, 4])
    );
  } finally {
    restore();
  }
});

//===================================================================

test('private document download preserves canonical JSON errors', async () => {
  const restore = configureEnvironment();

  try {
    globalThis.fetch = async () =>
      new Response(
        JSON.stringify({
          status: 'error',
          message: 'Document not found',
          code: 'DOCUMENT_NOT_FOUND',
        }),
        {
          status: 404,
          headers: { 'content-type': 'application/json' },
        }
      );

    const response = await proxyPrivateBackendDownloadRequest({
      request: new NextRequest(
        'https://pharmacy.example/api/pharmacies/me/documents/abc',
        { headers: { cookie: `${ACCESS_TOKEN_COOKIE_NAME}=access` } }
      ),
      requestId: 'download-error',
      backendPath: '/pharmacies/me/documents/abc',
    });

    assert.equal(response.status, 404);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.deepEqual(await response.json(), {
      status: 'error',
      message: 'Document not found',
      code: 'DOCUMENT_NOT_FOUND',
    });
  } finally {
    restore();
  }
});
