import assert from 'node:assert/strict';
import test from 'node:test';

import {
  LEGACY_CUSTOM_PRODUCT_REQUEST_CATEGORY,
  PRODUCT_CATEGORY_KINDS,
  PRODUCT_CATEGORY_SEED_DEFINITIONS,
} from '../constants/product-category';

import { buildProductCategorySeedOperations } from './product-category-bootstrap.service';
import { resolveLegacyProductCategory } from './product-category-migration.service';

//===============================================================

test('initial ProductCategory seed contains only real categories', () => {
  assert.deepEqual(
    PRODUCT_CATEGORY_SEED_DEFINITIONS.map(({ name }) => name),
    ['Medicine', 'Vitamins', 'Beauty', 'Hygiene', 'Medical devices']
  );

  const seedSlugs: readonly string[] = PRODUCT_CATEGORY_SEED_DEFINITIONS.map(
    ({ slug }) => slug
  );

  const seedNames: readonly string[] = PRODUCT_CATEGORY_SEED_DEFINITIONS.map(
    ({ name }) => name
  );

  assert.equal(
    seedSlugs.includes(LEGACY_CUSTOM_PRODUCT_REQUEST_CATEGORY),
    false
  );

  assert.equal(seedNames.includes('Other'), false);
  assert.deepEqual(PRODUCT_CATEGORY_KINDS, ['standard']);

  assert.deepEqual(
    PRODUCT_CATEGORY_SEED_DEFINITIONS.map(({ color }) => color),
    ['#3B82F6', '#22C55E', '#EC4899', '#14B8A6', '#8B5CF6']
  );
});

//===============================================================

test('ProductCategory seed uses idempotent upserts with setOnInsert only', () => {
  const operations = buildProductCategorySeedOperations();

  assert.equal(operations.length, PRODUCT_CATEGORY_SEED_DEFINITIONS.length);

  for (const operation of operations) {
    assert.ok('updateOne' in operation);
    assert.equal(operation.updateOne.upsert, true);
    assert.ok(operation.updateOne.update.$setOnInsert);
    assert.equal('$set' in operation.updateOne.update, false);
  }
});

//===============================================================

test('legacy Other is a ProductRequest compatibility sentinel, not a category record', () => {
  assert.deepEqual(resolveLegacyProductCategory('other'), {
    kind: 'custom_request',
  });

  assert.deepEqual(resolveLegacyProductCategory('medical-devices'), {
    kind: 'category',
    slug: 'medical_devices',
  });

  assert.deepEqual(resolveLegacyProductCategory('Medical devices'), {
    kind: 'category',
    slug: 'medical_devices',
  });
});
