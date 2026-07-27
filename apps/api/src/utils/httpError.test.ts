import assert from 'node:assert/strict';
import test from 'node:test';

import { httpError } from './httpError';

//===================================================================

test('preserves a stable business error code', () => {
  const error = httpError(
    400,
    'Mutable user-facing message',
    undefined,
    'CART_PHARMACY_LIMIT_EXCEEDED'
  );

  assert.equal(error.status, 400);
  assert.equal(error.code, 'CART_PHARMACY_LIMIT_EXCEEDED');
  assert.equal(error.message, 'Mutable user-facing message');
});
