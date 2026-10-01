import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

//===================================================================

async function read(relativePath: string): Promise<string> {
  return readFile(resolve(process.cwd(), relativePath), 'utf8');
}

//===================================================================

test('product domain stores ProductCategory relations instead of static category strings', async () => {
  const [productModel, requestModel, orderModel] = await Promise.all([
    read('src/models/product.model.ts'),
    read('src/models/productRequest.model.ts'),
    read('src/models/order.model.ts'),
  ]);

  assert.match(
    productModel,
    /categoryId:\s*\{[\s\S]*?ref:\s*'ProductCategory'/
  );

  assert.doesNotMatch(productModel, /category:\s*\{[\s\S]*?PRODUCT_CATEGORIES/);

  assert.match(requestModel, /categoryMode:\s*\{/);

  assert.match(
    requestModel,
    /categoryId:\s*\{[\s\S]*?ref:\s*'ProductCategory'/
  );

  assert.doesNotMatch(requestModel, /enum:\s*PRODUCT_CATEGORIES/);

  assert.match(orderModel, /categoryId:\s*\{/);
  assert.match(orderModel, /categoryNameSnapshot:/);
  assert.match(orderModel, /categorySlugSnapshot:/);

  assert.doesNotMatch(
    orderModel,
    /enum:\s*Object\.values\(PRODUCT_CATEGORIES\)/
  );
});

//===================================================================

test('query validation accepts dynamic category slugs without a static enum', async () => {
  const [productSchema, clientSchema, requestSchema] = await Promise.all([
    read('src/schemas/product.schema.ts'),
    read('src/schemas/client.schema.ts'),
    read('src/schemas/product-request.schema.ts'),
  ]);

  for (const source of [productSchema, clientSchema, requestSchema]) {
    assert.match(source, /productCategorySlugSchema/);
    assert.doesNotMatch(source, /z\.enum\(PRODUCT_CATEGORIES\)/);
  }
});

//===================================================================

test('custom Product Request behavior is metadata-based and public categories have a canonical read route', async () => {
  const [requestService, categoryConstants, routes, categoryService] =
    await Promise.all([
      read('src/services/product-request.service.ts'),
      read('src/constants/product-category.ts'),
      read('src/routes/index.ts'),
      read('src/services/product-category.service.ts'),
    ]);

  assert.match(requestService, /categoryMode === 'custom'/);
  assert.doesNotMatch(requestService, /category\s*===\s*['"]other['"]/);

  assert.doesNotMatch(
    categoryConstants,
    /name:\s*['"]Other['"][\s\S]*?PRODUCT_CATEGORY_SEED_DEFINITIONS/
  );

  assert.doesNotMatch(
    categoryConstants,
    /PRODUCT_CATEGORIES|PRODUCT_CATEGORY_LABELS/
  );

  assert.match(
    routes,
    /routes\.use\('\/product-categories', productCategoryRoutes\)/
  );

  assert.match(
    categoryService,
    /ProductCategory\.find\(\{ status: 'active' \}\)/
  );

  assert.match(
    categoryService,
    /\.sort\(\{ sortOrder: 1, name: 1, _id: 1 \}\)/
  );
});

//===================================================================

test('legacy relation migration covers products, product requests and order snapshots without making legacy values authoritative', async () => {
  const migration = await read(
    'src/services/product-category-migration.service.ts'
  );

  assert.match(migration, /collection\('products'\)/);
  assert.match(migration, /collection\('productrequests'\)/);
  assert.match(migration, /collection\('orders'\)/);

  assert.match(migration, /\$unset:\s*\{[\s\S]*?category:\s*''/);
  assert.match(migration, /categoryMode = 'custom'/);
  assert.match(migration, /categoryNameSnapshot/);
  assert.match(migration, /categorySlugSnapshot/);
  assert.match(migration, /migratedOrderSnapshots/);

  assert.doesNotMatch(
    migration,
    /export\s+const\s+PRODUCT_CATEGORIES|PRODUCT_CATEGORY_LABELS/
  );
});
