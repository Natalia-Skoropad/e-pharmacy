import assert from 'node:assert/strict';
import test from 'node:test';

import {
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
    }),
    { name: 'Baby care', color: '#ABCDEF' }
  );

  assert.throws(
    () =>
      updateAdminProductCategorySchema.parse({
        name: 'Baby care',
        color: '#fff',
      }),
    /#RRGGBB/i
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
