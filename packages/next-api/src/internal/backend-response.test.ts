import assert from 'node:assert/strict';
import test from 'node:test';

import {
  InvalidBackendResponseError,
  validateBackendJsonResponse,
} from './backend-response.ts';

//===================================================================

test('accepts valid JSON and empty 204 responses', async () => {
  await validateBackendJsonResponse(
    new Response(JSON.stringify({ status: 'success' }), {
      headers: { 'content-type': 'application/json; charset=utf-8' },
    })
  );
  await validateBackendJsonResponse(new Response(null, { status: 204 }));
});

//===================================================================

test('rejects HTML and malformed JSON backend responses', async () => {
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
