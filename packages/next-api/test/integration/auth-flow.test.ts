import assert from 'node:assert/strict';
import test from 'node:test';

import { transformAuthResponseBody } from '../../src/internal/auth-tokens.ts';

//===================================================================

for (const flow of ['login', 'register', 'refresh']) {
  test(`${flow}: valid backend tokens are stripped before the browser response`, () => {
    const result = transformAuthResponseBody(
      JSON.stringify({
        status: 'success',
        data: {
          user: { id: '64b7ea389c68bbec640519ab' },
          tokens: { accessToken: 'access', refreshToken: 'refresh' },
        },
      })
    );

    assert.ok(result.tokens);
    assert.equal(JSON.parse(result.body).data.tokens, undefined);
  });

  test(`${flow}: success without tokens is an invalid auth response`, () => {
    const result = transformAuthResponseBody(
      JSON.stringify({ status: 'success', data: { user: {} } })
    );

    assert.equal(result.tokens, undefined);
    assert.equal(result.issue, 'missing-tokens');
  });
}
