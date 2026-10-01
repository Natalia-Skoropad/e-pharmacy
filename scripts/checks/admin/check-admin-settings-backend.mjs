import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
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

const exists = async (...segments) => {
  try {
    await access(path.join(ROOT_DIR, ...segments));
    return true;
  } catch {
    return false;
  }
};

//===================================================================

const requiredFiles = [
  ['apps', 'api', 'src', 'constants', 'settings-dictionary.ts'],
  ['apps', 'api', 'src', 'models', 'position.model.ts'],
  ['apps', 'api', 'src', 'schemas', 'admin-settings.schema.ts'],
  ['apps', 'api', 'src', 'services', 'admin-settings.service.ts'],
  ['apps', 'api', 'src', 'controllers', 'admin-settings.controller.ts'],
  ['apps', 'api', 'src', 'types', 'admin-settings.ts'],
  ['apps', 'api', 'src', 'types', 'position.ts'],
];

for (const file of requiredFiles) {
  assert.equal(
    await exists(...file),
    true,
    `Admin Settings backend file must exist: ${file.join('/')}`
  );
}

//===================================================================

const routes = await read('apps', 'api', 'src', 'routes', 'admin.routes.ts');

const service = await read(
  'apps',
  'api',
  'src',
  'services',
  'admin-settings.service.ts'
);

const schema = await read(
  'apps',
  'api',
  'src',
  'schemas',
  'admin-settings.schema.ts'
);

const positionModel = await read(
  'apps',
  'api',
  'src',
  'models',
  'position.model.ts'
);

const categoryModel = await read(
  'apps',
  'api',
  'src',
  'models',
  'productCategory.model.ts'
);

const adminAccessModel = await read(
  'apps',
  'api',
  'src',
  'models',
  'adminAccess.model.ts'
);

const seed = await read('apps', 'api', 'src', 'scripts', 'seed.ts');

//===================================================================

for (const [pathPart, permission] of [
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
      `['"]/${pathPart.replaceAll('/', '\\/')}['"][\\s\\S]*?ADMIN_PERMISSIONS\\.${resource}\\.${action}`
    )
  );
}

assert.match(schema, /keyword/);
assert.match(schema, /createdFrom/);
assert.match(schema, /createdTo/);
assert.match(schema, /positivePageSchema/);
assert.match(schema, /createPerPageSchema/);

assert.match(positionModel, /normalizedName/);
assert.match(positionModel, /unique:\s*true/);
assert.match(categoryModel, /normalizedName/);
assert.match(categoryModel, /unique:\s*true/);

assert.match(service, /Product\.aggregate/);
assert.match(service, /ProductRequest\.aggregate/);
assert.match(service, /productsCount/);
assert.match(service, /productRequestsCount/);
assert.match(service, /employeesCount/);
assert.match(service, /earliestCreatedAt/);
assert.match(service, /isMongoDuplicateKeyError/);
assert.match(service, /HTTP_STATUS\.CONFLICT/);
assert.equal((service.match(/session\.withTransaction/g) ?? []).length, 6);
assert.equal((service.match(/appendAdminAuditLog\(/g) ?? []).length, 6);

assert.doesNotMatch(adminAccessModel, /position(?:Id)?/i);
assert.doesNotMatch(seed, /Position\.(?:create|insertMany|bulkWrite)/);

console.log('Admin Settings CRUD backend structural checks passed.');
