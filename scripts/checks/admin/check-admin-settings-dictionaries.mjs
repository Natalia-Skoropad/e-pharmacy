import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

//===================================================================

const ROOT_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  '..'
);

const read = (...segments) =>
  readFile(path.join(ROOT_DIR, ...segments), 'utf8');

//===================================================================

const [
  routes,
  schema,
  service,
  categoryModel,
  positionModel,
  page,
  parser,
  auditParser,
  auditPresentation,
] = await Promise.all([
  read('apps', 'api', 'src', 'routes', 'admin.routes.ts'),
  read('apps', 'api', 'src', 'schemas', 'admin-settings.schema.ts'),
  read('apps', 'api', 'src', 'services', 'admin-settings.service.ts'),
  read('apps', 'api', 'src', 'models', 'productCategory.model.ts'),
  read('apps', 'api', 'src', 'models', 'position.model.ts'),

  read(
    'apps',
    'admin',
    'src',
    'components',
    'settings',
    'SettingsDictionary',
    'SettingsDictionaryPage.tsx'
  ),

  read('apps', 'admin', 'src', 'lib', 'settings', 'settings-dictionary.ts'),
  read('apps', 'admin', 'src', 'lib', 'audit', 'admin-audit.ts'),
  read('apps', 'admin', 'src', 'lib', 'audit', 'admin-audit-presentation.ts'),
]);

//===================================================================
// Concurrent duplicate create is closed by DB unique indexes and mapped to 409.

assert.match(categoryModel, /normalizedName:[\s\S]*?unique:\s*true/);
assert.match(categoryModel, /slug:[\s\S]*?unique:\s*true/);
assert.match(positionModel, /normalizedName:[\s\S]*?unique:\s*true/);
assert.match(service, /isMongoDuplicateKeyError/);
assert.match(service, /HTTP_STATUS\.CONFLICT/);
assert.match(service, /A category with this name already exists/);
assert.match(service, /A position with this name already exists/);

//===================================================================
// Stale resources and stale usage are verified by the backend at mutation time.

assert.ok((service.match(/HTTP_STATUS\.NOT_FOUND/g) ?? []).length >= 4);

assert.equal(
  (service.match(/getCategoryUsageInSession\(category\._id, session\)/g) ?? [])
    .length,
  2
);

assert.match(
  service,
  /updateAdminProductCategoryService[\s\S]*?getCategoryUsageInSession[\s\S]*?usage\.total > 0 && isIdentityChange[\s\S]*?category\.save\(\{ session \}\)/
);

assert.match(
  service,
  /deleteAdminProductCategoryService[\s\S]*?getCategoryUsageInSession[\s\S]*?usage\.total > 0[\s\S]*?ProductCategory\.deleteOne/
);

//===================================================================
// Permission checks stay server-side and operation-specific.

for (const [routePath, permission] of [
  ['product-categories', 'categories.view'],
  ['product-categories', 'categories.create'],
  ['product-categories/:categoryId', 'categories.edit'],
  ['product-categories/:categoryId', 'categories.delete'],
  ['positions', 'positions.view'],
  ['positions', 'positions.create'],
  ['positions/:positionId', 'positions.edit'],
  ['positions/:positionId', 'positions.delete'],
]) {
  const [resource, action] = permission.split('.');
  assert.match(
    routes,
    new RegExp(
      `['"]/${routePath.replaceAll('/', '\\/')}['"][\\s\\S]*?ADMIN_PERMISSIONS\\.${resource}\\.${action}`
    )
  );
}

//===================================================================
// Date filters are real calendar dates and include complete UTC boundaries.

assert.match(schema, /isDateRangeOrdered/);
assert.match(schema, /DATE_RANGE_MESSAGE/);
assert.match(service, /T00:00:00\.000Z/);
assert.match(service, /T23:59:59\.999Z/);
assert.match(service, /\$gte:\s*startOfUtcDay/);
assert.match(service, /\$lte:\s*endOfUtcDay/);

//===================================================================
// Empty DB, filtered-empty and last-row deletion do not leave an invalid page.

assert.match(service, /totalPages:\s*Math\.ceil\(total \/ query\.perPage\)/);
assert.match(service, /earliestCreatedAt:[\s\S]*?null/);
assert.match(parser, /const expectedTotalPages = total === 0 \? 0/);

assert.match(
  page,
  /response\.totalPages === 0 \|\| page > response\.totalPages/
);

assert.match(page, /setPage\(Math\.max\(1, response\.totalPages\)\)/);
assert.match(page, /page > 1 && \(data\?\.items\.length \?\? 0\) === 1/);
assert.match(page, /setPage\(\(current\) => Math\.max\(1, current - 1\)\)/);

assert.match(
  page,
  /isFiltered \? config\.filteredEmptyLabel : config\.emptyLabel/
);

//===================================================================
// 403/404/409 have explicit UX, and reload synchronizes stale usage state.

assert.match(page, /error\.httpStatus === 409/);
assert.match(page, /error\.httpStatus === 403/);
assert.match(page, /error\.httpStatus === 404/);
assert.match(page, /response\.items\.find/);

assert.match(
  page,
  /refreshedItem\s*\?\s*\{\s*mode:\s*'edit',\s*item:\s*refreshedItem\s*\}/
);

assert.match(
  page,
  /error\.httpStatus === 404[\s\S]*?formState\.mode === 'edit'[\s\S]*?setFormState\(null\)[\s\S]*?reload\(\)/
);

assert.match(page, /error\.httpStatus === 409[\s\S]*?reload\(\)/);

//===================================================================
// Settings mutations stay transactionally audited and remain renderable.

assert.equal((service.match(/session\.withTransaction/g) ?? []).length, 6);
assert.equal((service.match(/appendAdminAuditLog\(/g) ?? []).length, 6);

for (const value of [
  'productCategory.created',
  'productCategory.updated',
  'productCategory.deleted',
  'position.created',
  'position.updated',
  'position.deleted',
]) {
  assert.match(auditParser, new RegExp(value.replaceAll('.', '\\.')));
  assert.match(auditPresentation, new RegExp(value.replaceAll('.', '\\.')));
}

assert.match(
  auditPresentation,
  /categories:\s*ADMIN_ROUTES\.SETTINGS_PRODUCT_CATEGORIES/
);

assert.match(
  auditPresentation,
  /positions:\s*ADMIN_ROUTES\.SETTINGS_POSITIONS/
);

console.log('Admin Settings dictionary hardening checks passed.');
