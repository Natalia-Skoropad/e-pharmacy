import assert from 'node:assert/strict';
import test from 'node:test';

import { ApiError } from './api-error';
import { apiRequest } from './api-request';
import { prepareRequestBody } from './request-body';

//===================================================================

const originalFetch = globalThis.fetch;

//===================================================================

function isInvalidBody(error: unknown): error is ApiError {
  return (
    error instanceof ApiError && error.transportCode === 'INVALID_REQUEST_BODY'
  );
}

//===================================================================

test('serializes JSON and preserves supported text/urlencoded bodies', () => {
  const jsonHeaders = new Headers();
  assert.equal(
    prepareRequestBody({ value: 1 }, jsonHeaders),
    JSON.stringify({ value: 1 })
  );
  assert.equal(jsonHeaders.get('content-type'), 'application/json');

  const textHeaders = new Headers({ 'content-type': 'text/plain' });
  assert.equal(prepareRequestBody('hello', textHeaders), 'hello');

  const params = new URLSearchParams({ page: '1' });
  assert.equal(prepareRequestBody(params, new Headers()), params);
});

//===================================================================

test('turns cyclic and BigInt serialization failures into controlled errors', () => {
  const cyclic: Record<string, unknown> = {};
  cyclic.self = cyclic;

  for (const body of [cyclic, { value: 1n }]) {
    assert.throws(
      () => prepareRequestBody(body, new Headers()),
      (error: unknown) =>
        isInvalidBody(error) &&
        error.cause !== undefined &&
        error.payload === undefined
    );
  }
});

//===================================================================

test('rejects custom toJSON, content-type mismatches and multipart bodies', () => {
  let customToJsonCalled = false;

  const custom = {
    value: 'secret',
    toJSON() {
      customToJsonCalled = true;
      return { value: 'changed' };
    },
  };

  assert.throws(() => prepareRequestBody(custom, new Headers()), isInvalidBody);
  assert.equal(customToJsonCalled, false);

  assert.throws(
    () =>
      prepareRequestBody(
        { value: 1 },
        new Headers({ 'content-type': 'text/plain' })
      ),
    isInvalidBody
  );

  assert.throws(
    () =>
      prepareRequestBody(
        'boundary payload',
        new Headers({ 'content-type': 'multipart/form-data' })
      ),
    isInvalidBody
  );
});

//===================================================================

test('rejects unsupported native bodies without exposing sensitive payloads', () => {
  const secret = 'do-not-log-this';

  for (const body of [
    new Uint8Array([1, 2, 3]),
    new ArrayBuffer(4),
    new Blob([secret]),
    new FormData(),
  ]) {
    assert.throws(
      () =>
        prepareRequestBody(
          body as unknown as Parameters<typeof prepareRequestBody>[0],
          new Headers()
        ),
      (error: unknown) =>
        isInvalidBody(error) &&
        !error.message.includes(secret) &&
        error.payload === undefined
    );
  }
});

//===================================================================

test('forbids GET bodies at compile time intent and runtime boundary', async () => {
  if (false) {
    await apiRequest('/resource', {
      baseUrl: 'https://api.example',
      method: 'POST',
      // @ts-expect-error FormData is intentionally outside the supported API body contract.
      body: new FormData(),
    });
  }

  globalThis.fetch = async () =>
    new Response(JSON.stringify({ status: 'success', data: null }), {
      headers: { 'content-type': 'application/json' },
    });

  try {
    await assert.rejects(
      apiRequest('/resource', {
        baseUrl: 'https://api.example',
        method: 'GET',
        body: { secret: 'hidden' },
      }),

      (error: unknown) =>
        isInvalidBody(error) &&
        error.url === 'https://api.example/resource' &&
        error.method === 'GET' &&
        !error.message.includes('hidden') &&
        error.payload === undefined
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
