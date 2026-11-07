import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

//===================================================================

const read = (file: string) => readFile(resolve(process.cwd(), file), 'utf8');

//===================================================================

test('Own products handles first-level URL filters and product details separately', async () => {
  const [single, all] = await Promise.all([
    read('src/app/pharmacy/products/[productId]/page.tsx'),
    read('src/app/pharmacy/products/[[...filters]]/page.tsx'),
  ]);

  assert.match(single, /isOwnProductsFilterSegment\(productId\)/);
  assert.match(single, /parseOwnProductsPaginationSegments\(params\)/);
  assert.match(all, /isOwnProductsFilterRoute\(segments\)/);
  assert.match(all, /<OwnerOwnProductsPageContent/);
  assert.match(all, /redirect\(\s*buildOwnProductsPath\(/);
});

//===================================================================

test('canonical segments include pharmacy, product, stock, page and rows per page', async () => {
  const paths = await read('src/lib/products/own-product-paths.ts');

  for (const fragment of [
    'pharmacy-id-',
    'product-id-',
    'stock-',
    'page-',
    'per-page-',
  ]) {
    assert.match(paths, new RegExp(fragment));
  }

  assert.match(paths, /parseOwnProductsPaginationSegments/);
  assert.match(paths, /buildOwnProductsPath/);
});

//===================================================================

test('owner inventory filter routes do not require selected pharmacy membership', async () => {
  const [scope, boundary] = await Promise.all([
    read('src/lib/pharmacies/selected-pharmacy-scope.ts'),
    read('src/components/layout/PharmacyShell/PharmacyCabinetBoundary.tsx'),
  ]);

  assert.match(scope, /isOwnerProductsListPath/);
  assert.match(scope, /!isOwnerProductsListPath\(pathname\)/);
  assert.match(boundary, /isOwnerProductsListPath\(pathname\)/);
  assert.match(scope, /getPharmacyIdFromDetailPath/);
});
