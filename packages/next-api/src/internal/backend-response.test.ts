import assert from 'node:assert/strict';
import test from 'node:test';

import {
  InvalidBackendResponseError,
  validateBackendApiEnvelopeResponse,
  validateBackendJsonResponse,
} from './backend-response.ts';

//===================================================================

function json(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

//===================================================================

test('generic JSON validation accepts canonical JSON and empty 204 responses', async () => {
  await assert.doesNotReject(
    validateBackendJsonResponse(
      new Response(JSON.stringify({ status: 'success' }), {
        headers: { 'content-type': 'application/json; charset=utf-8' },
      })
    )
  );

  await assert.doesNotReject(
    validateBackendJsonResponse(new Response(null, { status: 204 }))
  );
});

//===================================================================

test('generic JSON validation rejects HTML and malformed JSON backend responses', async () => {
  await assert.rejects(
    validateBackendJsonResponse(
      new Response('<html>Error</html>', {
        status: 500,
        headers: { 'content-type': 'text/html' },
      })
    ),
    InvalidBackendResponseError
  );

  await assert.rejects(
    validateBackendJsonResponse(
      new Response('{broken', {
        headers: { 'content-type': 'application/json' },
      })
    ),
    InvalidBackendResponseError
  );
});

//===================================================================

test('generic JSON validation remains syntax-only for private transport consumers', async () => {
  await assert.doesNotReject(
    validateBackendJsonResponse(json({ unexpected: true }))
  );
});

//===================================================================

test('API envelope validation accepts canonical success and error envelopes', async () => {
  await assert.doesNotReject(
    validateBackendApiEnvelopeResponse(
      json({ status: 'success', data: { id: 'value' } })
    )
  );

  await assert.doesNotReject(
    validateBackendApiEnvelopeResponse(
      json({ status: 'error', message: 'Conflict', code: 'CONFLICT' }, 409)
    )
  );
});

//===================================================================

test('API envelope validation rejects syntactically valid but non-canonical payloads', async () => {
  await assert.rejects(
    validateBackendApiEnvelopeResponse(json({ unexpected: true })),
    InvalidBackendResponseError
  );

  await assert.rejects(
    validateBackendApiEnvelopeResponse(json({ foo: 'bar' }, 503)),
    InvalidBackendResponseError
  );
});
