import assert from 'node:assert/strict';
import test from 'node:test';

import { appendSearchParams } from './query.ts';

//===================================================================

test('appends search params to a path without query', () => {
  assert.equal(
    appendSearchParams('/products', '?page=2&search=%D0%BB%D1%96%D0%BA%D0%B8'),
    '/products?page=2&search=%D0%BB%D1%96%D0%BA%D0%B8'
  );
});

//===================================================================

test('merges search params with an existing query', () => {
  assert.equal(
    appendSearchParams('/products?scope=public', '?page=2&page=3'),
    '/products?scope=public&page=2&page=3'
  );
});

//===================================================================

test('keeps the original path when search is empty', () => {
  assert.equal(
    appendSearchParams('/products?scope=public', ''),
    '/products?scope=public'
  );
});


//===================================================================

test('preserves repeated, encoded, and Unicode values while dropping fragments', () => {
  assert.equal(
    appendSearchParams('/products?tag=first#ignored', '?tag=second&name=%D0%90%D0%BF%D1%82%D0%B5%D0%BA%D0%B0&value=a%3Db'),
    '/products?tag=first&tag=second&name=%D0%90%D0%BF%D1%82%D0%B5%D0%BA%D0%B0&value=a%3Db'
  );
});
