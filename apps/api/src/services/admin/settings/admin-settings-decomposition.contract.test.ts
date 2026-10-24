import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';
import test from 'node:test';

//===============================================================

const SRC = resolve(process.cwd(), 'src');
const DIR = resolve(SRC, 'services/admin/settings');

const MODULES = [
  'admin-settings-date-filters.ts',
  'admin-settings-category-usage.ts',
  'admin-settings-category-projection.ts',
  'admin-settings-position-projection.ts',
  'admin-settings-category-read.service.ts',
  'admin-settings-position-read.service.ts',
  'admin-settings-category-mutation.service.ts',
  'admin-settings-position-mutation.service.ts',
] as const;

const read = (name: string): string => readFileSync(resolve(DIR, name), 'utf8');

//===============================================================

test('S10.10 removes the Admin Settings monolith and uses direct canonical imports', () => {
  assert.equal(existsSync(resolve(DIR, 'admin-settings.service.ts')), false);

  for (const name of MODULES) {
    const source = read(name);

    assert.ok(source.length > 150, `${name} must own real code`);

    assert.doesNotMatch(source, /^export\s+\*\s+from\s+/m);
    assert.doesNotMatch(source, /^export\s+\{[^}]+\}\s+from\s+/m);
  }

  const controller = readFileSync(
    resolve(SRC, 'controllers/admin/admin-settings.controller.ts'),
    'utf8'
  );

  for (const name of [
    'admin-settings-category-read.service',
    'admin-settings-position-read.service',
    'admin-settings-category-mutation.service',
    'admin-settings-position-mutation.service',
  ]) {
    assert.ok(
      controller.includes(`/settings/${name}`),
      `Missing direct import: ${name}`
    );
  }

  assert.doesNotMatch(controller, /admin-settings\.service/);
});

//===============================================================

test('S10.10 Settings modules have no import cycles or broken relative references', () => {
  const canonical = new Set<string>(MODULES);
  const visiting = new Set<string>();
  const visited = new Set<string>();

  const visit = (name: string): void => {
    assert.ok(
      !visiting.has(name),
      `Circular Settings module dependency: ${name}`
    );

    if (visited.has(name)) return;

    visiting.add(name);

    for (const match of read(name).matchAll(/from\s+['"](\.[^'"]+)['"]/g)) {
      const target = resolve(dirname(resolve(DIR, name)), match[1]);

      const file = [target + '.ts', resolve(target, 'index.ts')].find(
        existsSync
      );

      assert.ok(file, `${name}: unresolved relative import ${match[1]}`);

      if (dirname(file) === DIR && canonical.has(basename(file)))
        visit(basename(file));
    }

    visiting.delete(name);
    visited.add(name);
  };

  MODULES.forEach(visit);
  assert.equal(visited.size, MODULES.length);
});

//===============================================================

test('S10.10 category mutations keep all three audited Mongo transactions', () => {
  const source = read('admin-settings-category-mutation.service.ts');

  assert.equal((source.match(/session\.withTransaction/g) ?? []).length, 3);
  assert.equal((source.match(/appendAdminAuditLog\(/g) ?? []).length, 3);

  assert.match(source, /session: ClientSession/);

  for (const action of [
    'PRODUCT_CATEGORY_CREATED',
    'PRODUCT_CATEGORY_UPDATED',
    'PRODUCT_CATEGORY_DELETED',
  ]) {
    assert.match(source, new RegExp(`ADMIN_AUDIT_ACTIONS\\.${action}`));
  }

  assert.match(source, /isMongoDuplicateKeyError/);
  assert.match(source, /normalizeProductCategoryColor/);
  assert.match(source, /getCategoryUsageInSession\(category\._id, session\)/);
  assert.match(source, /category\.save\(\{ session \}\)/);

  assert.match(
    source,
    /ProductCategory\.deleteOne\(\{ _id: category\._id \}\)\.session\(session\)/
  );
});

//===============================================================

test('S10.10 in-use category protection covers products and requests', () => {
  const usage = read('admin-settings-category-usage.ts');
  const mutations = read('admin-settings-category-mutation.service.ts');

  assert.match(usage, /Product\.aggregate/);
  assert.match(usage, /ProductRequest\.aggregate/);

  assert.match(
    usage,
    /Product\.countDocuments\(\{ categoryId \}\)\.session\(session\)/
  );

  assert.match(
    usage,
    /ProductRequest\.countDocuments\(\{ categoryId \}\)\.session\(session\)/
  );

  assert.equal(
    (
      mutations.match(/getCategoryUsageInSession\(category\._id, session\)/g) ??
      []
    ).length,
    2
  );

  assert.equal((mutations.match(/if \(usage\.total > 0\)/g) ?? []).length, 2);

  assert.match(
    mutations,
    /This category is already in use and cannot be edited/
  );

  assert.match(
    mutations,
    /This category is already in use and cannot be deleted/
  );
});

//===============================================================

test('S10.10 position mutations keep all three audited Mongo transactions and conflict translation', () => {
  const source = read('admin-settings-position-mutation.service.ts');

  assert.equal((source.match(/session\.withTransaction/g) ?? []).length, 3);
  assert.equal((source.match(/appendAdminAuditLog\(/g) ?? []).length, 3);

  assert.match(source, /isMongoDuplicateKeyError/);
  assert.match(source, /zeroPositionUsage/);
  assert.match(source, /position\.save\(\{ session \}\)/);

  assert.match(
    source,
    /Position\.deleteOne\(\{ _id: position\._id \}\)\.session\(session\)/
  );

  for (const action of [
    'POSITION_CREATED',
    'POSITION_UPDATED',
    'POSITION_DELETED',
  ]) {
    assert.match(source, new RegExp(`ADMIN_AUDIT_ACTIONS\\.${action}`));
  }
});

//===============================================================

test('S10.10 preserves dictionary pagination, UTC date windows and safe projections', () => {
  const filters = read('admin-settings-date-filters.ts');
  const categories = read('admin-settings-category-read.service.ts');
  const positions = read('admin-settings-position-read.service.ts');
  const categoryProjection = read('admin-settings-category-projection.ts');
  const positionProjection = read('admin-settings-position-projection.ts');

  assert.match(filters, /T00:00:00\.000Z/);
  assert.match(filters, /T23:59:59\.999Z/);

  for (const source of [categories, positions]) {
    assert.match(source, /buildCreatedAtFilter\(query\)/);
    assert.match(source, /\.sort\(\{ createdAt: -1, _id: -1 \}\)/);
    assert.match(source, /\.limit\(query\.perPage\)/);
    assert.match(source, /totalPages: Math\.ceil\(total \/ query\.perPage\)/);
    assert.match(source, /earliestCreatedAt/);
  }

  assert.match(categoryProjection, /PRODUCT_CATEGORY_DEFAULT_COLOR/);
  assert.match(categoryProjection, /PRODUCT_CATEGORY_SEED_DEFINITIONS/);
  assert.match(positionProjection, /employeesCount: 0, total: 0/);
});
