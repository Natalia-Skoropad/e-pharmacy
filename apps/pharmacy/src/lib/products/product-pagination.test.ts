import assert from 'node:assert/strict';
import test from 'node:test';

import {
  clampProductListPage,
  getProductListTotalPages,
} from './product-pagination';

//===================================================================

test('clamps the last page after the last row is removed', () => {
  assert.equal(getProductListTotalPages(81, 20), 5);
  assert.equal(clampProductListPage(5, 80, 20), 4);
});

//===================================================================

test('keeps the current page when a mutation does not reduce total pages', () => {
  assert.equal(clampProductListPage(4, 80, 20), 4);
  assert.equal(clampProductListPage(1, 0, 20), 1);
});

//===================================================================

test('normalizes invalid pages defensively', () => {
  assert.equal(clampProductListPage(0, 100, 20), 1);
  assert.equal(clampProductListPage(99, 100, 20), 5);
});
