import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import test from 'node:test';

import { ApiError, createApiClient } from '../../src/transport/index';

//===================================================================

test('configured transport works against a real HTTP boundary', async () => {
  let calls = 0;
  const server = createServer((_request, response) => {
    calls += 1;

    if (calls === 1) {
      response.writeHead(503, { 'content-type': 'application/problem+json' });
      response.end(
        JSON.stringify({ status: 'error', message: 'Temporary outage' })
      );
      return;
    }

    response.writeHead(200, {
      'content-type': 'application/vnd.api+json; charset=utf-8',
    });
    response.end(JSON.stringify({ status: 'success', data: { ok: true } }));
  });

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  assert.ok(address && typeof address === 'object');

  try {
    const client = createApiClient({
      baseUrl: `http://127.0.0.1:${address.port}/v1`,
      defaults: {
        retry: { attempts: 2, delayMs: 0 },
        timeoutMs: 2_000,
      },
    });

    assert.deepEqual(await client.request('/health'), {
      status: 'success',
      data: { ok: true },
    });
    assert.equal(calls, 2);
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve()))
    );
  }
});

//===================================================================

test('real HTTP malformed JSON keeps response status and transport code', async () => {
  const server = createServer((_request, response) => {
    response.writeHead(200, { 'content-type': 'application/problem+json' });
    response.end('{');
  });

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  assert.ok(address && typeof address === 'object');

  try {
    const client = createApiClient({
      baseUrl: `http://127.0.0.1:${address.port}`,
      defaults: { retry: false },
    });

    await assert.rejects(
      client.request('/broken'),
      (error: unknown) =>
        error instanceof ApiError &&
        error.transportCode === 'INVALID_RESPONSE' &&
        error.httpStatus === 200 &&
        error.url?.endsWith('/broken') === true &&
        error.method === 'GET'
    );
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve()))
    );
  }
});
