import assert from 'node:assert/strict';
import test from 'node:test';

import { createProxyResponse } from './proxy-response.ts';

//===================================================================

test('normalizes successful 204 responses to a truly empty browser response', () => {
  const upstream = new Response(null, {
    status: 204,
    headers: {
      'content-length': '0',
      'content-type': 'application/json',
    },
  });

  const response = createProxyResponse(upstream, {
    cacheControl: 'no-store',
    requestId: 'request-delete-1',
  });

  assert.equal(response.status, 204);
  assert.equal(response.body, null);
  assert.equal(response.headers.has('content-length'), false);
  assert.equal(response.headers.has('content-type'), false);
});
