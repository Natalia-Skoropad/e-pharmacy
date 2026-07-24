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
