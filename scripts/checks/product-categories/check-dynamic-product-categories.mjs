import assert from 'node:assert/strict';
import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

//===================================================================

const ROOT_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  '..'
);

const read = (...segments) =>
  readFile(path.join(ROOT_DIR, ...segments), 'utf8');

const exists = async (...segments) => {
  try {
    await access(path.join(ROOT_DIR, ...segments));
    return true;
  } catch {
    return false;
  }
};

//===================================================================

const SOURCE_ROOTS = [
  ['apps', 'api', 'src'],
  ['apps', 'client', 'src'],
  ['apps', 'pharmacy', 'src'],
  ['apps', 'admin', 'src'],
  ['packages', 'api-client', 'src'],
  ['packages', 'config', 'src'],
  ['packages', 'types', 'src'],
  ['packages', 'validation', 'src'],
];

const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.mjs']);

async function collectProductionSources(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const target = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await collectProductionSources(target)));
      continue;
    }

    if (!entry.isFile() || !SOURCE_EXTENSIONS.has(path.extname(entry.name))) {
      continue;
    }

    if (/\.(?:test|spec)\.[^.]+$/.test(entry.name)) continue;
    files.push(target);
  }

  return files;
}

const productionFiles = (
  await Promise.all(
    SOURCE_ROOTS.map((segments) =>
      collectProductionSources(path.join(ROOT_DIR, ...segments))
    )
  )
).flat();

//===================================================================

assert.equal(
  await exists('apps', 'api', 'src', 'types', 'categories.ts'),
  false,
  'Obsolete static apps/api/src/types/categories.ts must be deleted.'
);

for (const file of productionFiles) {
  const source = await readFile(file, 'utf8');
  const relative = path.relative(ROOT_DIR, file);

  assert.doesNotMatch(
    source,
    /\bPRODUCT_CATEGORIES\b/,
    `${relative} must not use PRODUCT_CATEGORIES as business logic.`
  );

  assert.doesNotMatch(
    source,
    /\bPRODUCT_CATEGORY_LABELS\b/,
    `${relative} must not use PRODUCT_CATEGORY_LABELS as business logic.`
  );

  assert.doesNotMatch(
    source,
    /z\.enum\(\s*PRODUCT_CATEGORIES\s*\)/,
    `${relative} must validate dynamic category slugs instead of a static enum.`
  );

  assert.doesNotMatch(
    source,
    /type\s+ProductCategory\s*=\s*(?:\r?\n\s*)?\|?\s*['"]/,
    `${relative} must not define ProductCategory as a literal-value union.`
  );

  assert.doesNotMatch(
    source,
    /\bcategory\s*(?:===|==|!==|!=)\s*['"]other['"]/,
    `${relative} must not use category === 'other' style business logic.`
  );

  assert.doesNotMatch(
    source,
    /['"]other['"]\s*(?:===|==|!==|!=)\s*\bcategory\b/,
    `${relative} must not use 'other' === category style business logic.`
  );

  assert.doesNotMatch(
    source,
    /(?:from|import\()\s*['"][^'"]*types\/categories['"]/
  );
}

//===================================================================

const [
  productModel,
  productRequestModel,
  orderModel,
  productSchema,
  clientSchema,
  productRequestSchema,
  categoryService,
  categoryConstants,
  migrationService,
  sharedProductCategory,
  productCategoryAlias,
  frontendCategoryConfig,
] = await Promise.all([
  read('apps', 'api', 'src', 'models', 'product.model.ts'),
  read('apps', 'api', 'src', 'models', 'productRequest.model.ts'),
  read('apps', 'api', 'src', 'models', 'order.model.ts'),
  read('apps', 'api', 'src', 'schemas', 'product.schema.ts'),
  read('apps', 'api', 'src', 'schemas', 'client.schema.ts'),
  read('apps', 'api', 'src', 'schemas', 'product-request.schema.ts'),
  read('apps', 'api', 'src', 'services', 'product-category.service.ts'),
  read('apps', 'api', 'src', 'constants', 'product-category.ts'),

  read(
    'apps',
    'api',
    'src',
    'services',
    'product-category-migration.service.ts'
  ),

  read('packages', 'types', 'src', 'reference-data', 'product-category.ts'),
  read('packages', 'types', 'src', 'products', 'category.ts'),
  read('packages', 'config', 'src', 'products', 'categories.ts'),
]);

assert.match(productModel, /categoryId:[\s\S]*?ref:\s*'ProductCategory'/);
assert.match(productRequestModel, /categoryMode:/);

assert.match(
  productRequestModel,
  /categoryId:[\s\S]*?ref:\s*'ProductCategory'/
);

assert.match(orderModel, /categoryId:/);
assert.match(orderModel, /categoryNameSnapshot:/);
assert.match(orderModel, /categorySlugSnapshot:/);

for (const schema of [productSchema, clientSchema, productRequestSchema]) {
  assert.match(schema, /productCategorySlugSchema/);
}

assert.match(
  categoryService,
  /ProductCategory\.find\(\{ status: 'active' \}\)/
);

assert.match(categoryService, /sortOrder: 1/);
assert.match(sharedProductCategory, /ProductCategoryReference/);
assert.match(productCategoryAlias, /ProductCategoryReference/);
assert.match(frontendCategoryConfig, /ALL_PRODUCT_CATEGORIES_FILTER_OPTION/);

assert.doesNotMatch(
  categoryConstants,
  /LEGACY_CUSTOM_PRODUCT_REQUEST_CATEGORY|PRODUCT_CATEGORIES|PRODUCT_CATEGORY_LABELS/
);

assert.doesNotMatch(
  categoryConstants,
  /name:\s*['"]Other['"]/,
  'Other must not be bootstrapped as a ProductCategory.'
);

// Legacy data is migrated once; it is not a runtime category source.
assert.match(migrationService, /collection\('products'\)/);
assert.match(migrationService, /collection\('productrequests'\)/);
assert.match(migrationService, /collection\('orders'\)/);
assert.match(migrationService, /categoryMode = 'custom'/);
assert.match(migrationService, /categoryNameSnapshot/);
assert.match(migrationService, /categorySlugSnapshot/);
assert.match(migrationService, /\$unset:[\s\S]*?category:\s*''/);

console.log('Dynamic product-category structural checks passed.');
