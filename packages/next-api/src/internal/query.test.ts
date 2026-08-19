import assert from 'node:assert/strict';
import test from 'node:test';

import {
  appendSearchParams,
  MAX_PROXY_QUERY_LENGTH,
  MAX_PROXY_QUERY_PARAMETER_COUNT,
  MAX_PROXY_URL_LENGTH,
  ProxyQueryError,
} from './query.ts';

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
    appendSearchParams(
      '/products?tag=first#ignored',
      '?tag=second&name=%D0%90%D0%BF%D1%82%D0%B5%D0%BA%D0%B0&value=a%3Db'
    ),
    '/products?tag=first&tag=second&name=%D0%90%D0%BF%D1%82%D0%B5%D0%BA%D0%B0&value=a%3Db'
  );
});

//===================================================================

test('rejects query strings above the practical encoded-length limit', () => {
  assert.throws(
    () =>
      appendSearchParams(
        '/products',
        `?q=${'a'.repeat(MAX_PROXY_QUERY_LENGTH)}`
      ),
    (error: unknown) =>
      error instanceof ProxyQueryError &&
      error.status === 414 &&
      error.code === 'QUERY_TOO_LARGE'
  );
});

//===================================================================

test('counts repeated parameters toward the practical query parameter limit', () => {
  const search = `?${Array.from(
    { length: MAX_PROXY_QUERY_PARAMETER_COUNT + 1 },
    (_, index) => `tag=${index}`
  ).join('&')}`;

  assert.throws(
    () => appendSearchParams('/products', search),
    (error: unknown) =>
      error instanceof ProxyQueryError &&
      error.status === 400 &&
      error.code === 'INVALID_QUERY'
  );
});

//===================================================================

test('rejects an excessive combined backend path and query URL length', () => {
  const path = `/${'a'.repeat(MAX_PROXY_URL_LENGTH)}`;

  assert.throws(
    () => appendSearchParams(path, '?q=1'),
    (error: unknown) =>
      error instanceof ProxyQueryError &&
      error.status === 414 &&
      error.code === 'QUERY_TOO_LARGE'
  );
});
