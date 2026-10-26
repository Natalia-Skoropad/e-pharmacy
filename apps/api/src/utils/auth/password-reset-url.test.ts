import assert from 'node:assert/strict';
import test from 'node:test';

import { buildPasswordResetUrl } from './password-reset-url';

//===================================================================

test('includes a query fallback while keeping the fragment reset handoff', () => {
  const token = 'secret+/= token';
  const value = buildPasswordResetUrl('https://client.example.com', token);
  const url = new URL(value);

  assert.equal(url.pathname, '/reset-password');
  assert.equal(url.searchParams.get('token'), token);
  assert.equal(new URLSearchParams(url.hash.slice(1)).get('token'), token);
});
