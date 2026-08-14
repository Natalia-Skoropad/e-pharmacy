import assert from 'node:assert/strict';
import test from 'node:test';

import { buildPasswordResetUrl } from './password-reset-url';

//===================================================================

test('puts the reset secret in the fragment instead of the server request URL', () => {
  const token = 'secret+/= token';
  const value = buildPasswordResetUrl('https://client.example.com', token);
  const url = new URL(value);

  assert.equal(url.pathname, '/reset-password');
  assert.equal(url.search, '');
  assert.equal(new URLSearchParams(url.hash.slice(1)).get('token'), token);

  assert.equal(
    `${url.origin}${url.pathname}${url.search}`.includes(token),
    false
  );
});
