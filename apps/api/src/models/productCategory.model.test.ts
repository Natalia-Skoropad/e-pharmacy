import assert from 'node:assert/strict';
import test from 'node:test';

import { ProductCategory } from './productCategory.model';

//===============================================================

test('ProductCategory normalizes persistence name and uniqueness key', async () => {
  const category = new ProductCategory({
    name: '  Medical  devices  ',
    normalizedName: 'ignored input',
    slug: 'medical_devices',
    status: 'active',
    kind: 'standard',
    sortOrder: 50,
  });

  await category.validate();

  assert.equal(category.name, 'Medical  devices');
  assert.equal(category.normalizedName, 'medical devices');
  assert.equal(category.createdBy, null);
  assert.equal(category.updatedBy, null);
});

//===============================================================

test('ProductCategory rejects invalid name, slug and sort order', async () => {
  const invalidName = new ProductCategory({
    name: 'medicine',
    slug: 'medicine',
    sortOrder: 10,
  });

  await assert.rejects(invalidName.validate(), /uppercase letter/i);

  const invalidSlug = new ProductCategory({
    name: 'Medicine',
    slug: 'Medical-devices',
    sortOrder: 10,
  });

  await assert.rejects(invalidSlug.validate(), /snake_case/i);

  const invalidSortOrder = new ProductCategory({
    name: 'Medicine',
    slug: 'medicine',
    sortOrder: 10.5,
  });

  await assert.rejects(invalidSortOrder.validate(), /integer/i);
});

//===============================================================

test('ProductCategory has database-level unique indexes for normalizedName and slug', () => {
  type SchemaIndex = readonly [
    Record<string, number | string>,
    Readonly<{ unique?: boolean }>,
  ];

  const indexes = ProductCategory.schema.indexes() as SchemaIndex[];

  const normalizedNameIndex = indexes.find(
    ([keys]) => keys.normalizedName === 1 && Object.keys(keys).length === 1
  );

  const slugIndex = indexes.find(
    ([keys]) => keys.slug === 1 && Object.keys(keys).length === 1
  );

  assert.ok(normalizedNameIndex);
  assert.equal(normalizedNameIndex[1].unique, true);
  assert.ok(slugIndex);
  assert.equal(slugIndex[1].unique, true);
});
