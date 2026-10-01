import assert from 'node:assert/strict';
import test from 'node:test';

import {
  adminSettingsDictionaryListQuerySchema,
  createAdminSettingsDictionaryItemSchema,
} from './admin-settings.schema';

//===============================================================

test('Settings dictionary name contract is shared and strict', () => {
  assert.equal(
    createAdminSettingsDictionaryItemSchema.safeParse({
      name: 'Content manager',
    }).success,
    true
  );

  for (const name of ['content manager', 'Контент менеджер', 'Manager123']) {
    assert.equal(
      createAdminSettingsDictionaryItemSchema.safeParse({ name }).success,
      false
    );
  }
});

//===============================================================

test('Settings dictionary list query supports pagination, search and ordered dates', () => {
  assert.deepEqual(adminSettingsDictionaryListQuerySchema.parse({}), {
    page: 1,
    perPage: 20,
  });

  assert.deepEqual(
    adminSettingsDictionaryListQuerySchema.parse({
      page: '2',
      perPage: '50',
      keyword: 'Medical',
      createdFrom: '2026-09-01',
      createdTo: '2026-09-30',
    }),
    {
      page: 2,
      perPage: 50,
      keyword: 'Medical',
      createdFrom: '2026-09-01',
      createdTo: '2026-09-30',
    }
  );

  assert.equal(
    adminSettingsDictionaryListQuerySchema.safeParse({
      createdFrom: '2026-10-02',
      createdTo: '2026-10-01',
    }).success,
    false
  );
});
