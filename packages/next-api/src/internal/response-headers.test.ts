import assert from 'node:assert/strict';
import test from 'node:test';

import { createProxyResponseHeaders } from './response-headers.ts';

//===================================================================

test('forwards the approved response header allowlist', () => {
  const source = new Headers({
    'Content-Type': 'application/json',
    Location: '/next',
    'Retry-After': '30',
    ETag: '"abc"',
    'Content-Disposition': 'attachment; filename=test.pdf',
    'RateLimit-Limit': '100',
    'RateLimit-Remaining': '99',
    Vary: 'Accept-Encoding',
    traceparent: '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01',
    'Set-Cookie': 'secret=1',
    'X-Internal-Debug': 'hidden',
  });

  const result = createProxyResponseHeaders(source, 'no-store', 'request-1');

  assert.equal(result.get('content-type'), 'application/json');
  assert.equal(result.get('location'), '/next');
  assert.equal(result.get('retry-after'), '30');
  assert.equal(result.get('etag'), '"abc"');

  assert.equal(
    result.get('content-disposition'),
    'attachment; filename=test.pdf'
  );

  assert.equal(result.get('ratelimit-limit'), '100');
  assert.equal(result.get('ratelimit-remaining'), '99');
  assert.equal(result.get('vary'), 'Accept-Encoding');
  assert.equal(result.get('set-cookie'), null);
  assert.equal(result.get('x-internal-debug'), null);
  assert.equal(result.get('x-request-id'), 'request-1');
});

//===================================================================

test('response header policy forwards only safe relative redirects', () => {
  const safe = createProxyResponseHeaders(
    new Headers({ location: '/login?reason=expired' }),
    'no-store',
    'request-id'
  );

  assert.equal(safe.get('location'), '/login?reason=expired');

  const external = createProxyResponseHeaders(
    new Headers({ location: 'https://evil.example/path' }),
    'no-store',
    'request-id'
  );

  assert.equal(external.get('location'), null);

  const protocolRelative = createProxyResponseHeaders(
    new Headers({ location: '//evil.example/path' }),
    'no-store',
    'request-id'
  );
  assert.equal(protocolRelative.get('location'), null);
});

//===================================================================

test('drops unsafe allowlisted values and always owns the response request id', () => {
  const source = new Headers({
    'X-Request-ID': 'backend-request-id',
    'Retry-After': '10',
    'Set-Cookie': 'backend-secret=1',
  });

  source.set('Vary', 'x'.repeat(5000));

  const result = createProxyResponseHeaders(
    source,
    'no-store',
    'bff-request-id'
  );

  assert.equal(result.get('x-request-id'), 'bff-request-id');
  assert.equal(result.get('retry-after'), '10');
  assert.equal(result.get('vary'), null);
  assert.equal(result.get('set-cookie'), null);
});
