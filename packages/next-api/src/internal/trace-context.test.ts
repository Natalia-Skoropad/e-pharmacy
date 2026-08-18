import assert from 'node:assert/strict';
import test from 'node:test';

import {
  applyServerCorrelationHeaders,
  createTraceparent,
} from './trace-context';

//===================================================================

test('creates W3C trace context from the request id', () => {
  const requestId = '123e4567-e89b-12d3-a456-426614174000';
  const traceparent = createTraceparent(requestId);

  assert.match(
    traceparent ?? '',
    /^00-123e4567e89b12d3a456426614174000-[0-9a-f]{16}-01$/
  );
});

//===================================================================

test('cacheable server requests keep correlation outside the application cache-key header', () => {
  const requestId = '123e4567-e89b-12d3-a456-426614174000';
  const first = new Headers();
  const second = new Headers();

  applyServerCorrelationHeaders(first, requestId, true);
  applyServerCorrelationHeaders(second, requestId, true);

  assert.equal(first.get('x-request-id'), null);
  assert.equal(second.get('x-request-id'), null);
  assert.match(first.get('traceparent') ?? '', /^00-/);
  assert.match(second.get('traceparent') ?? '', /^00-/);
});

//===================================================================

test('no-store server requests preserve x-request-id correlation', () => {
  const headers = new Headers();
  applyServerCorrelationHeaders(
    headers,
    '123e4567-e89b-12d3-a456-426614174000',
    false
  );

  assert.equal(
    headers.get('x-request-id'),
    '123e4567-e89b-12d3-a456-426614174000'
  );
  assert.equal(headers.get('traceparent'), null);
});

//===================================================================

test('rejects request ids that cannot become a W3C trace id', () => {
  assert.equal(createTraceparent('request-123'), null);
  assert.equal(createTraceparent('00000000-0000-0000-0000-000000000000'), null);
});
