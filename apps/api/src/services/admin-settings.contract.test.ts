import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

//===============================================================

const source = readFileSync(
  resolve(process.cwd(), 'src', 'services', 'admin-settings.service.ts'),
  'utf8'
);

//===============================================================

test('Settings mutations keep domain changes and audit writes in transactions', () => {
  assert.equal((source.match(/session\.withTransaction/g) ?? []).length, 6);
  assert.equal((source.match(/appendAdminAuditLog\(/g) ?? []).length, 6);

  for (const action of [
    'PRODUCT_CATEGORY_CREATED',
    'PRODUCT_CATEGORY_UPDATED',
    'PRODUCT_CATEGORY_DELETED',
    'POSITION_CREATED',
    'POSITION_UPDATED',
    'POSITION_DELETED',
  ]) {
    assert.match(source, new RegExp(`ADMIN_AUDIT_ACTIONS\\.${action}`));
  }
});

//===============================================================

test('Category usage and mutation locks cover products and product requests', () => {
  assert.match(source, /Product\.countDocuments\(\{ categoryId \}\)/);
  assert.match(source, /ProductRequest\.countDocuments\(\{ categoryId \}\)/);
  assert.match(source, /cannot be edited/);
  assert.match(source, /cannot be deleted/);
  assert.match(source, /HTTP_STATUS\.CONFLICT/);
});

//===============================================================

test('Settings duplicate failures are translated from Mongo unique indexes', () => {
  assert.match(source, /isMongoDuplicateKeyError/);
  assert.match(source, /A category with this name already exists/);
  assert.match(source, /A position with this name already exists/);
});
