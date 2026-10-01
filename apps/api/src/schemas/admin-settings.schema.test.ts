import assert from 'node:assert/strict';
import test from 'node:test';

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
