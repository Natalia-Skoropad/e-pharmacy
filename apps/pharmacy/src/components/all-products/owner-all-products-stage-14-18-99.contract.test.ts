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
    /resolveOwnerCatalogCategory\(\s*product\.category,\s*categoryDirectory\s*\)/
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
  const [page, confirmation] = await Promise.all([
    source(
      'src/components/all-products/AllProductsPageContent/AllProductsPageContent.tsx'
    ),

    source(
      'src/components/all-products/OwnerAddProductConfirmation/OwnerAddProductConfirmation.tsx'
    ),
  ]);

  assert.match(page, /<OwnerAddProductConfirmation/);
  assert.match(page, /isLoading=\{Boolean\(addingProductId\)\}/);
  assert.match(confirmation, /<ConfirmationModal/);
  assert.match(confirmation, /eyebrow="ALL PRODUCTS"/);
  assert.match(confirmation, /confirmIconLeft=\{<PackagePlus/);
  assert.match(confirmation, /cancelIconLeft=\{<X/);
  assert.match(confirmation, /closeOnBackdrop=\{!isLoading\}/);
});
