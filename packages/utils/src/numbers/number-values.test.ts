import assert from 'node:assert/strict';
import test from 'node:test';

import {
  formatAvailableProductsCount,
  formatCountLabel,
  formatPharmaciesCount,
  formatStockLabel,
  getFiniteNumber,
  normalizeCount,
} from './number-values';

//===================================================================

test('normalizes finite numbers without accepting numeric strings', () => {
  assert.equal(getFiniteNumber(2.5), 2.5);
  assert.equal(getFiniteNumber('2.5'), undefined);
  assert.equal(getFiniteNumber(Number.NaN), undefined);
  assert.equal(getFiniteNumber(Number.POSITIVE_INFINITY), undefined);
});

//===================================================================

test('rejects invalid counts', () => {
  for (const value of [-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
    assert.equal(normalizeCount(value), null);
    assert.equal(formatCountLabel(value, 'item'), null);
  }
});

//===================================================================

test('formats valid count labels', () => {
  assert.equal(formatCountLabel(0, 'item'), '0 items');
  assert.equal(formatCountLabel(1, 'item'), '1 item');
  assert.equal(formatCountLabel(2, 'item'), '2 items');
  assert.equal(formatAvailableProductsCount(2), '2 products available');
  assert.equal(formatPharmaciesCount(1), '1 pharmacy');
  assert.equal(formatStockLabel(0), '0 items available in this pharmacy');
});
