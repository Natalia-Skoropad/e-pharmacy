import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

//===================================================================

const pharmacySource = (path: string) =>
  readFile(resolve(process.cwd(), path), 'utf8');

const backendSource = (path: string) =>
  readFile(resolve(process.cwd(), '../api', path), 'utf8');

//===================================================================

test('public category DTO and Admin categories use one canonical icon fallback', async () => {
  const [constants, publicService, adminProjection] = await Promise.all([
    backendSource('src/constants/catalog/product-category.ts'),
    backendSource('src/services/catalog/product-category.service.ts'),

    backendSource(
      'src/services/admin/settings/admin-settings-category-projection.ts'
    ),
  ]);

  assert.match(constants, /export function resolveProductCategoryIcon\(/);
  assert.match(constants, /PRODUCT_CATEGORY_SEED_DEFINITIONS\.find\(/);
  assert.match(publicService, /icon: resolveProductCategoryIcon\(category\)/);
  assert.match(adminProjection, /icon: resolveProductCategoryIcon\(category\)/);
});

//===================================================================

test('both All products category views consume the canonical API directory', async () => {
  const [page, table, drawer, categoryRoute] = await Promise.all([
    pharmacySource(
      'src/components/all-products/AllProductsPageContent/AllProductsPageContent.tsx'
    ),

    pharmacySource(
      'src/components/all-products/AllProductsTable/AllProductsTable.tsx'
    ),

    pharmacySource(
      'src/components/all-products/AllProductsFiltersDrawer/AllProductsFiltersDrawer.tsx'
    ),

    pharmacySource('src/app/api/product-categories/route.ts'),
  ]);

  assert.match(page, /setCategoryDirectory\(options\)/);
  assert.match(page, /categoryDirectory=\{categoryDirectory\}/);
  assert.match(page, /categoryOptions=\{categoryOptions\}/);

  assert.match(
    table,
    /resolveOwnerCatalogCategory\(product\.category, categoryDirectory\)/
  );

  assert.match(drawer, /CategoryIcon name=\{option\.icon\}/);
  assert.match(categoryRoute, /revalidate: 0/);
  assert.match(categoryRoute, /staleWhileRevalidate: 0/);
});
