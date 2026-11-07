import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

//===================================================================

const source = (path: string) => readFile(resolve(process.cwd(), path), 'utf8');

//===================================================================

test('owner product table has no Color column and resolves categories from the Admin directory', async () => {
  const [table, page] = await Promise.all([
    source('src/components/all-products/AllProductsTable/AllProductsTable.tsx'),

    source(
      'src/components/all-products/AllProductsPageContent/AllProductsPageContent.tsx'
    ),
  ]);

  assert.doesNotMatch(table, /key: 'categoryColor'/);

  assert.match(
    table,
    /resolveOwnerCatalogCategory\(product\.category, categoryDirectory\)/
  );

  assert.match(page, /getProductCategories/);
  assert.match(page, /setCategoryDirectory\(options\)/);
  assert.match(page, /categoryDirectory=\{categoryDirectory\}/);
});

//===================================================================

test('category select options and product table share the same Admin directory', async () => {
  const [page, drawer] = await Promise.all([
    source(
      'src/components/all-products/AllProductsPageContent/AllProductsPageContent.tsx'
    ),

    source(
      'src/components/all-products/AllProductsFiltersDrawer/AllProductsFiltersDrawer.tsx'
    ),
  ]);

  assert.match(page, /categoryDirectory\.map\(\(category\)/);
  assert.match(page, /icon: category\.icon/);
  assert.match(page, /categoryOptions=\{categoryOptions\}/);
  assert.match(drawer, /CategoryIcon name=\{option\.icon\}/);
});

//===================================================================

test('Add confirmation uses shared profile modal with icon-labelled actions', async () => {
  const page = await source(
    'src/components/all-products/AllProductsPageContent/AllProductsPageContent.tsx'
  );

  assert.match(page, /<ConfirmationModal/);
  assert.match(page, /eyebrow="ALL PRODUCTS"/);
  assert.match(page, /confirmIconLeft=\{<PackagePlus/);
  assert.match(page, /cancelIconLeft=\{<X/);
  assert.match(page, /closeOnBackdrop=\{!addingProductId\}/);
});
