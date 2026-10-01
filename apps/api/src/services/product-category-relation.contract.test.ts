import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

//===================================================================

async function read(relativePath: string): Promise<string> {
  return readFile(resolve(process.cwd(), relativePath), 'utf8');
}

//===================================================================

test('Stage 11.3 product domain stores ProductCategory relations instead of static category strings', async () => {
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

test('Stage 11.3 query validation accepts dynamic category slugs without the static enum', async () => {
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

test('Stage 11.3 custom Product Request behavior is metadata-based and public categories have a canonical read route', async () => {
  const [requestService, categoryConstants, routes, categoryService] =
    await Promise.all([
      read('src/services/product-request.service.ts'),
      read('src/constants/product-category.ts'),
      read('src/routes/index.ts'),
      read('src/services/product-category.service.ts'),
    ]);

  assert.match(requestService, /categoryMode === 'custom'/);
  assert.doesNotMatch(requestService, /category\s*===\s*['"]other['"]/);

  assert.match(categoryConstants, /LEGACY_CUSTOM_PRODUCT_REQUEST_CATEGORY/);

  assert.doesNotMatch(
    categoryConstants,
    /name:\s*['"]Other['"][\s\S]*?PRODUCT_CATEGORY_SEED_DEFINITIONS/
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
