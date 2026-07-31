import assert from 'node:assert/strict';
import test from 'node:test';

import { getStockAvailabilityState } from './StockAvailability';

//===================================================================

test('distinguishes unknown stock from a confirmed zero quantity', () => {
  assert.deepEqual(getStockAvailabilityState(undefined), { status: 'unknown' });
  assert.deepEqual(getStockAvailabilityState(null), { status: 'unknown' });

  assert.deepEqual(getStockAvailabilityState(0), {
    status: 'known',
    quantity: 0,
  });

  assert.deepEqual(getStockAvailabilityState(1), {
    status: 'known',
    quantity: 1,
  });

  assert.deepEqual(getStockAvailabilityState(24), {
    status: 'known',
    quantity: 24,
  });
});

//===================================================================

test('rejects malformed stock instead of visually normalizing it', () => {
  for (const value of [-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
    assert.throws(() => getStockAvailabilityState(value), RangeError);
  }
});
