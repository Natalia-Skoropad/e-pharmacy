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

const validTokens = {
  accessToken: 'access',
  refreshToken: 'refresh',
  accessTokenExpiresIn: 900,
  refreshTokenExpiresIn: 2_592_000,
};

//===================================================================

test('extracts valid tokens, expiry metadata, and removes them from the browser body', () => {
  const result = transformAuthResponseBody(successBody(validTokens));

  assert.deepEqual(result.tokens, validTokens);
  assert.equal(JSON.parse(result.body).data.tokens, undefined);
  assert.equal(JSON.parse(result.body).data.user.id, '1');
});

//===================================================================

test('rejects missing, malformed, and unsafe token lifetime objects', () => {
  assert.equal(
    transformAuthResponseBody(JSON.stringify({ status: 'success', data: {} }))
      .issue,
    'missing-tokens'
  );

  for (const tokens of [
    { accessToken: 1 },
    { ...validTokens, accessTokenExpiresIn: 0 },
    { ...validTokens, refreshTokenExpiresIn: Number.NaN },
    { ...validTokens, refreshTokenExpiresIn: 400 * 24 * 60 * 60 },
  ]) {
    assert.equal(
      transformAuthResponseBody(successBody(tokens)).issue,
      'malformed-tokens'
    );
  }

  assert.equal(transformAuthResponseBody('<html>').issue, 'invalid-json');
});
