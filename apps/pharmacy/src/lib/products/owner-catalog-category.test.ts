import assert from 'node:assert/strict';
import { test } from 'node:test';

//===================================================================

// Explicit URL lets Node's built-in TS runner execute this focused test too.
const { resolveOwnerCatalogCategory } = (await import(
  new URL('./owner-catalog-category.ts', import.meta.url).href
)) as typeof import('./owner-catalog-category');

//===================================================================

const product = {
  id: '507f1f77bcf86cd799439011',
  name: 'Medicine',
  slug: 'medicine',
};

const medicine = {
  ...product,
  icon: 'pill',
  color: '#3B82F6',
};

const directory = [
  { ...medicine, icon: 'heart-pulse' },
  {
    id: '507f1f77bcf86cd799439012',
    name: 'Hygiene',
    slug: 'hygiene',
    icon: 'droplets',
  },
];

//===================================================================

test('reads an Admin-configured icon instead of an old product snapshot icon', () => {
  const resolved = resolveOwnerCatalogCategory(medicine, directory);

  assert.equal(resolved.icon, 'heart-pulse');
  assert.equal(resolved.id, medicine.id);
  assert.equal(resolved.slug, medicine.slug);
});

//===================================================================

test('matches by slug when product category ID is older than the directory ID', () => {
  const resolved = resolveOwnerCatalogCategory(
    { ...medicine, id: '507f1f77bcf86cd799439013', icon: undefined },
    directory
  );

  assert.equal(resolved.icon, 'heart-pulse');
});

//===================================================================

test('category-specific icons are not mixed up between products', () => {
  const resolved = resolveOwnerCatalogCategory(
    {
      id: '507f1f77bcf86cd799439012',
      name: 'Hygiene',
      slug: 'hygiene',
    },
    directory
  );

  assert.equal(resolved.icon, 'droplets');
});

//===================================================================

test('keeps snapshot metadata when its category is absent from the current directory', () => {
  const resolved = resolveOwnerCatalogCategory(medicine, []);

  assert.deepEqual(resolved, medicine);
});
