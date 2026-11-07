import assert from 'node:assert/strict';
import test from 'node:test';
import { Types } from 'mongoose';

import {
  PRODUCT_CATEGORY_SEED_DEFINITIONS,
  resolveProductCategoryIcon,
} from '../../constants/catalog/product-category';

import { serializeCategory } from '../admin/settings/admin-settings-category-projection';
import { serializeProductCategoryReference } from './product-category.service';

//===================================================================

const categoryId = new Types.ObjectId('507f1f77bcf86cd799439011');
const now = new Date('2026-11-07T00:00:00.000Z');

//===================================================================

const usage = { productsCount: 0, productRequestsCount: 0, total: 0 };

//===================================================================

function categoryWithIcon(slug: string, icon?: string) {
  const definition = PRODUCT_CATEGORY_SEED_DEFINITIONS.find(
    (entry) => entry.slug === slug
  );

  assert.ok(definition);

  return {
    _id: categoryId,
    name: definition.name,
    slug,
    icon,
    color: definition.color,
    status: 'active' as const,
    kind: 'standard' as const,
    sortOrder: definition.sortOrder,
    normalizedName: definition.name.toLowerCase(),
    createdAt: now,
    updatedAt: now,
    createdBy: null,
    updatedBy: null,
  };
}

//===================================================================

test('Admin and catalog return the same distinct icons for legacy seed categories', () => {
  for (const definition of PRODUCT_CATEGORY_SEED_DEFINITIONS) {
    const category = categoryWithIcon(definition.slug);
    const publicCategory = serializeProductCategoryReference(category);
    const adminCategory = serializeCategory(category, usage);

    assert.equal(publicCategory.icon, definition.icon, definition.slug);
    assert.equal(publicCategory.icon, adminCategory.icon, definition.slug);
    assert.equal(publicCategory.id, adminCategory.id);
  }
});

//===================================================================

test('an explicitly configured Admin icon takes precedence over the seed icon', () => {
  const category = categoryWithIcon('medicine', 'heart-pulse');

  assert.equal(resolveProductCategoryIcon(category), 'heart-pulse');
  assert.equal(serializeProductCategoryReference(category).icon, 'heart-pulse');
  assert.equal(serializeCategory(category, usage).icon, 'heart-pulse');
});

//===================================================================

test('an unknown category without an icon uses a safe fallback, not another category icon', () => {
  assert.equal(resolveProductCategoryIcon({ slug: 'unknown' }), 'pill');
});
