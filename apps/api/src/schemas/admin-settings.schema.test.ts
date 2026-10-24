import assert from 'node:assert/strict';
import test from 'node:test';

import { PRODUCT_CATEGORY_ICONS } from '../constants/catalog/product-category-icon';

import {
  adminSettingsDictionaryListQuerySchema,
  createAdminProductCategorySchema,
  createAdminSettingsDictionaryItemSchema,
  updateAdminProductCategorySchema,
} from './admin-settings.schema';

//===============================================================

test('admin category mutations require and normalize a six-digit hex color', () => {
  assert.deepEqual(
    createAdminProductCategorySchema.parse({
      name: 'Baby care',
      color: '#abcdef',
      icon: 'pill',
    }),
    { name: 'Baby care', color: '#ABCDEF', icon: 'pill' }
  );

  assert.throws(
    () =>
      updateAdminProductCategorySchema.parse({
        name: 'Baby care',
        color: '#fff',
        icon: 'pill',
      }),
    /#RRGGBB/i
  );
});

//===============================================================

test('category icon is required and must be one of the 81 supported icons', () => {
  assert.equal(PRODUCT_CATEGORY_ICONS.length, 81);
  assert.equal(new Set(PRODUCT_CATEGORY_ICONS).size, 81);

  assert.throws(() =>
    createAdminProductCategorySchema.parse({
      name: 'Baby care',
      color: '#ABCDEF',
    })
  );

  assert.throws(() =>
    createAdminProductCategorySchema.parse({
      name: 'Baby care',
      color: '#ABCDEF',
      icon: 'unknown',
    })
  );

  assert.equal(
    createAdminProductCategorySchema.parse({
      name: 'Baby care',
      color: '#ABCDEF',
      icon: 'footprints',
    }).icon,
    'footprints'
  );
});

//===============================================================

test('position payload remains name-only and rejects category color metadata', () => {
  assert.deepEqual(
    createAdminSettingsDictionaryItemSchema.parse({ name: 'Manager' }),
    { name: 'Manager' }
  );

  assert.throws(() =>
    createAdminSettingsDictionaryItemSchema.parse({
      name: 'Manager',
      color: '#3B82F6',
    })
  );
});

//===============================================================

test('settings list dates accept real inclusive boundaries and reject invalid ranges', () => {
  assert.deepEqual(
    adminSettingsDictionaryListQuerySchema.parse({
      page: '1',
      perPage: '20',
      createdFrom: '2026-01-01',
      createdTo: '2026-12-31',
    }),
    {
      page: 1,
      perPage: 20,
      createdFrom: '2026-01-01',
      createdTo: '2026-12-31',
    }
  );

  assert.throws(
    () =>
      adminSettingsDictionaryListQuerySchema.parse({
        page: '1',
        perPage: '20',
        createdFrom: '2026-02-29',
      }),
    /valid calendar date/i
  );

  assert.throws(
    () =>
      adminSettingsDictionaryListQuerySchema.parse({
        page: '1',
        perPage: '20',
        createdFrom: '2026-10-02',
        createdTo: '2026-10-01',
      }),
    /earlier than or equal/i
  );
});
