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

//===============================================================

test('Category color is audited and can change without renaming an in-use category', () => {
  assert.match(source, /normalizeProductCategoryColor/);
  assert.match(source, /changedFields\.push\('color'\)/);
  assert.match(source, /usage\.total > 0 && isIdentityChange/);
  assert.match(source, /its name cannot be edited/);
});

//===============================================================

test('Settings mutations distinguish stale resources from in-use conflicts', () => {
  assert.ok((source.match(/HTTP_STATUS\.NOT_FOUND/g) ?? []).length >= 4);
  assert.match(source, /Product category was not found/);
  assert.match(source, /Position was not found/);
  assert.match(source, /usage\.total > 0 && isIdentityChange/);
  assert.match(source, /usage\.total > 0/);
  assert.match(source, /HTTP_STATUS\.CONFLICT/);
});

//===============================================================

test('Category usage is re-read inside mutation transactions before edit and delete', () => {
  assert.equal(
    (source.match(/getCategoryUsageInSession\(category\._id, session\)/g) ?? [])
      .length,
    2
  );

  assert.match(
    source,
    /updateAdminProductCategoryService[\s\S]*?getCategoryUsageInSession[\s\S]*?category\.save\(\{ session \}\)/
  );

  assert.match(
    source,
    /deleteAdminProductCategoryService[\s\S]*?getCategoryUsageInSession[\s\S]*?ProductCategory\.deleteOne/
  );
});

//===============================================================

test('Settings date filters include complete UTC calendar-day boundaries', () => {
  assert.match(source, /T00:00:00\.000Z/);
  assert.match(source, /T23:59:59\.999Z/);
  assert.match(source, /\$gte:\s*startOfUtcDay/);
  assert.match(source, /\$lte:\s*endOfUtcDay/);
});
