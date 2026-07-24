import assert from 'node:assert/strict';
import test from 'node:test';

import { transformAuthResponseBody } from './auth-tokens.ts';

//===================================================================

function successBody(tokens: unknown): string {
  return JSON.stringify({
    status: 'success',
    data: { user: { id: '1' }, tokens },
  });
}

//===================================================================

test('extracts valid tokens and removes them from the browser body', () => {
  const result = transformAuthResponseBody(
    successBody({ accessToken: 'access', refreshToken: 'refresh' })
  );

  assert.deepEqual(result.tokens, {
    accessToken: 'access',
    refreshToken: 'refresh',
  });
  assert.equal(JSON.parse(result.body).data.tokens, undefined);
  assert.equal(JSON.parse(result.body).data.user.id, '1');
});

//===================================================================

test('rejects missing and malformed token objects', () => {
  assert.equal(
    transformAuthResponseBody(JSON.stringify({ status: 'success', data: {} }))
      .issue,
    'missing-tokens'
  );
  assert.equal(
    transformAuthResponseBody(successBody({ accessToken: 1 })).issue,
    'malformed-tokens'
  );
  assert.equal(transformAuthResponseBody('<html>').issue, 'invalid-json');
});
