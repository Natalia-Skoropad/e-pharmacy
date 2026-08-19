import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getProxyRequestBodyLimitBytes,
  ProxyRequestBodyError,
  readProxyRequestBody,
} from './request-body.ts';

//===================================================================

test('forwards JSON bodies for POST, PATCH, PUT, and DELETE', async () => {
  for (const method of ['POST', 'PATCH', 'PUT', 'DELETE'] as const) {
    const request = new Request('https://client.example/api/test', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: method }),
    });

    assert.equal(
      await readProxyRequestBody(request, method),
      JSON.stringify({ value: method })
    );
  }
});

//===================================================================

test('uses semantic limits for small, standard, and document JSON payloads', () => {
  assert.equal(getProxyRequestBodyLimitBytes('smallJson'), 64 * 1024);
  assert.equal(getProxyRequestBodyLimitBytes('standardJson'), 1024 * 1024);
  assert.equal(
    getProxyRequestBodyLimitBytes('documentUpload'),
    32 * 1024 * 1024
  );
});

//===================================================================

test('rejects multipart and binary media types', async () => {
  const multipart = new Request('https://client.example/api/test', {
    method: 'POST',
    headers: { 'Content-Type': 'multipart/form-data; boundary=x' },
    body: '--x--',
  });

  await assert.rejects(() => readProxyRequestBody(multipart, 'POST'), {
    status: 415,
    code: 'UNSUPPORTED_MEDIA_TYPE',
  });
});

//===================================================================

test('returns undefined for an empty mutation body', async () => {
  const request = new Request('https://client.example/api/test', {
    method: 'DELETE',
  });

  assert.equal(await readProxyRequestBody(request, 'DELETE'), undefined);
});

//===================================================================

test('rejects declared oversized small JSON bodies before buffering', async () => {
  const request = new Request('https://example.test/api/auth/login', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'content-length': String(64 * 1024 + 1),
    },
    body: '{}',
  });

  await assert.rejects(
    readProxyRequestBody(request, 'POST', 'smallJson'),
    (error: unknown) =>
      error instanceof ProxyRequestBodyError && error.status === 413
  );
});

//===================================================================

test('rejects actual standard JSON size even when Content-Length is spoofed smaller', async () => {
  const request = new Request('https://example.test/api/orders/checkout', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'content-length': '2',
    },
    body: JSON.stringify({ value: 'x'.repeat(1024 * 1024) }),
  });

  await assert.rejects(
    readProxyRequestBody(request, 'POST', 'standardJson'),
    (error: unknown) =>
      error instanceof ProxyRequestBodyError && error.status === 413
  );
});

//===================================================================

test('accepts a realistic base64-sized document payload under documentUpload limit', async () => {
  const base64Bytes = Math.floor(13.4 * 1024 * 1024);
  const body = JSON.stringify({ dataUrl: 'x'.repeat(base64Bytes) });
  const request = new Request(
    'https://example.test/api/auth/pharmacy-documents',
    {
      method: 'POST',
      headers: { 'content-type': 'application/json; charset=utf-8' },
      body,
    }
  );

  const forwarded = await readProxyRequestBody(
    request,
    'POST',
    'documentUpload'
  );

  assert.equal(forwarded?.length, body.length);
});

//===================================================================

test('rejects invalid UTF-8 text bodies', async () => {
  const request = new Request('https://example.test/api/items', {
    method: 'POST',
    headers: { 'content-type': 'text/plain' },
    body: new Uint8Array([0xff]),
  });

  await assert.rejects(
    readProxyRequestBody(request, 'POST'),
    (error: unknown) =>
      error instanceof ProxyRequestBodyError && error.status === 415
  );
});
