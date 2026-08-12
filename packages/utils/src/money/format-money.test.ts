import assert from 'node:assert/strict';
import test from 'node:test';

import {
  formatAmount,
  formatMoney,
  formatMoneyRange,
  getNumericRange,
} from './format-money';

//===================================================================

test('formats finite amounts and money using the English UI locale', () => {
  assert.equal(formatAmount(0), '0.00');
  assert.equal(formatAmount(1.005), '1.01');
  assert.equal(formatAmount(-0), '0.00');
  assert.equal(formatMoney(12.5), '12.50 ₴');
  assert.equal(formatMoney(-12.5), '-12.50 ₴');
});

//===================================================================

test('rejects non-finite money values', () => {
  assert.equal(formatAmount(Number.NaN), null);
  assert.equal(formatMoney(Number.POSITIVE_INFINITY), null);
  assert.equal(formatMoney(Number.NEGATIVE_INFINITY), null);
});

//===================================================================

test('calculates and formats numeric ranges without UI fallback text', () => {
  assert.deepEqual(getNumericRange([10, 4, 7]), { min: 4, max: 10 });
  assert.equal(formatMoneyRange({ min: 4, max: 10 }), '4.00 ₴ – 10.00 ₴');
  assert.equal(formatMoneyRange({ min: 4, max: 4 }), '4.00 ₴');
  assert.equal(getNumericRange([]), null);
  assert.equal(getNumericRange([10, Number.NaN]), null);
  assert.equal(getNumericRange([Number.POSITIVE_INFINITY]), null);
  assert.equal(formatMoneyRange({ min: 10, max: 4 }), null);
});
