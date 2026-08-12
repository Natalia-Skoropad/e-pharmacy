import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

//===================================================================

test('continue shopping uses filter metadata, pagination and independent errors', async () => {
  const source = await readFile(
    path.resolve(
      process.cwd(),
      'src/components/cart/ContinueShoppingModal/ContinueShoppingModal.tsx'
    ),
    'utf8'
  );

  assert.match(source, /getProductFilters/);
  assert.match(source, /PRODUCTS_PER_PAGE = 24/);
  assert.match(source, /page,/);
  assert.match(source, /Load more/);
  assert.match(source, /categoryError/);
  assert.match(source, /productError/);
  assert.match(source, /addError/);
  assert.doesNotMatch(source, /PRODUCTS_LIMIT = 150/);
});
