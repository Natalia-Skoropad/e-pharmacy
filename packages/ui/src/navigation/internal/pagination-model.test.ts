import assert from 'node:assert/strict';
import test from 'node:test';

//===================================================================

import {
  getPaginationItems,
  normalizePaginationState,
} from './pagination-model.ts';

//===================================================================

test('normalizes invalid current pages without accepting invalid total pages', () => {
  assert.deepEqual(normalizePaginationState(0, 5), {
    currentPage: 1,
    totalPages: 5,
  });

  assert.deepEqual(normalizePaginationState(99, 5), {
    currentPage: 5,
    totalPages: 5,
  });

  assert.deepEqual(normalizePaginationState(Number.NaN, 5), {
    currentPage: 1,
    totalPages: 5,
  });

  assert.equal(normalizePaginationState(1, 0), null);
  assert.equal(normalizePaginationState(1, -1), null);
  assert.equal(normalizePaginationState(1, 1.5), null);
});

//===================================================================

test('creates a bounded pagination model for large page counts', () => {
  assert.deepEqual(getPaginationItems(1, 100), [1, 2, 'ellipsis-right', 100]);

  assert.deepEqual(getPaginationItems(50, 100), [
    1,
    'ellipsis-left',
    49,
    50,
    51,
    'ellipsis-right',
    100,
  ]);

  assert.deepEqual(getPaginationItems(100, 100), [1, 'ellipsis-left', 99, 100]);
});
