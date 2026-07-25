import assert from 'node:assert/strict';
import test from 'node:test';

import { ApiError } from './api-error';
import { apiRequest } from './api-request';
import { InvalidApiPathError } from './api-url';

//===================================================================

const originalFetch = globalThis.fetch;

const requestOptions = {
  baseUrl: 'https://api.example',
  retry: false as const,
};

//===================================================================

test('requires an explicit empty response contract for 204 responses', async () => {
  try {
    globalThis.fetch = async () => new Response(null, { status: 204 });

    await assert.rejects(
      apiRequest('/resource', requestOptions),
      (error: unknown) =>
        error instanceof ApiError && error.code === 'INVALID_RESPONSE'
    );

    globalThis.fetch = async () => new Response(null, { status: 204 });

    assert.equal(
      await apiRequest('/resource', {
        ...requestOptions,
        responseType: 'empty',
      }),
      undefined
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

//===================================================================

test('rejects successful non-JSON responses when JSON is required', async () => {
  try {
    globalThis.fetch = async () =>
      new Response('<html></html>', {
        status: 200,
        headers: { 'content-type': 'text/html' },
      });

    await assert.rejects(
      apiRequest('/resource', requestOptions),
      (error: unknown) =>
        error instanceof ApiError && error.code === 'INVALID_RESPONSE'
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

//===================================================================

test('rejects absolute, protocol-relative, and traversing API paths', async () => {
  for (const path of [
    'https://external.example/resource',
    '//external.example/resource',
    '/products/../admin',
    '/products/%2e%2e/admin',
  ]) {
    await assert.rejects(
      apiRequest(path, requestOptions),
      (error: unknown) => error instanceof InvalidApiPathError
    );
  }
});
