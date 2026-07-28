import assert from 'node:assert/strict';
import test from 'node:test';

import {
  InvalidQueryParameterError,
  appendQueryParams,
} from './query-string';

//===================================================================

test('preserves scalar zero and false while skipping empty values', () => {
  assert.equal(
    appendQueryParams('/products', {
      page: 0,
      inStock: false,
      search: '',
      category: null,
      pharmacyId: undefined,
    }),
    '/products?page=0&inStock=false'
  );
});

//===================================================================

test('merges an existing query and supports repeated primitive keys', () => {
  assert.equal(
    appendQueryParams('/products?sort=price&tag=old', {
      page: 2,
      tag: ['sale', 'новинка'],
    }),
    '/products?sort=price&page=2&tag=sale&tag=%D0%BD%D0%BE%D0%B2%D0%B8%D0%BD%D0%BA%D0%B0'
  );
});

//===================================================================

test('rejects non-finite numbers, nested values and fragments', () => {
  for (const params of [
    { price: Number.NaN },
    { price: Number.POSITIVE_INFINITY },
    { filter: { nested: true } as unknown as string },
  ]) {
    assert.throws(
      () => appendQueryParams('/products', params),
      InvalidQueryParameterError
    );
  }

  assert.throws(
    () => appendQueryParams('/products#details', { page: 1 }),
    InvalidQueryParameterError
  );
});
