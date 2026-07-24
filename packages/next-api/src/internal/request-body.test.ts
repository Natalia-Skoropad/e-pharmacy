import assert from 'node:assert/strict';
import test from 'node:test';

import { ProxyRequestBodyError, readProxyRequestBody } from './request-body.ts';

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

test('rejects declared oversized bodies before buffering', async () => {
  const request = new Request('https://example.test/api/items', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'content-length': String(32 * 1024 * 1024 + 1),
    },
    body: '{}',
  });

  await assert.rejects(
    readProxyRequestBody(request, 'POST'),
    (error: unknown) =>
      error instanceof ProxyRequestBodyError && error.status === 413
  );
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
