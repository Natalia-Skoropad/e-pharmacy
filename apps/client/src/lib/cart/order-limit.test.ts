import assert from 'node:assert/strict';
import test from 'node:test';

import { CART_PHARMACY_LIMIT_ERROR_CODE } from '@e-pharmacy/config/cart';
import { ApiError } from '@e-pharmacy/api-client/transport';

import { isCartOrderLimitError } from './order-limit';

//===================================================================

test('detects the cart pharmacy limit by stable API error code', () => {
  const error = new ApiError('Translated or changed backend message', 400, {
    status: 'error',
    message: 'Translated or changed backend message',
    code: CART_PHARMACY_LIMIT_ERROR_CODE,
  });

  assert.equal(isCartOrderLimitError(error), true);
});

//===================================================================

test('does not infer the cart limit from mutable English copy', () => {
  const error = new ApiError(
    'You cannot add more than 15 orders to your cart.',
    400,
    { status: 'error', message: 'You cannot add more than 15 orders.' }
  );

  assert.equal(isCartOrderLimitError(error), false);
});
