import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';
import test from 'node:test';

//===============================================================

const SRC = resolve(process.cwd(), 'src');
const AUDIT_DIR = resolve(SRC, 'services/admin/audit');

const CANONICAL = [
  'admin-audit-normalization.ts',
  'admin-audit-write.service.ts',
  'admin-audit-projection.ts',
  'admin-audit-filters.ts',
  'admin-audit-actors.service.ts',
  'admin-audit-read.service.ts',
] as const;

const read = (file: string) => readFileSync(resolve(AUDIT_DIR, file), 'utf8');

//===============================================================

test('S10.9 removes Admin Audit monolith and binds callers directly to canonical modules', () => {
  assert.equal(existsSync(resolve(AUDIT_DIR, 'admin-audit.service.ts')), false);

  for (const file of CANONICAL) {
    const source = read(file);

    assert.ok(source.trim().length > 100, `${file} must own behavior`);

    assert.doesNotMatch(source, /^export\s+\*\s+from\s+/m);
    assert.doesNotMatch(source, /^export\s+\{[^}]+\}\s+from\s+/m);
  }

  const controller = readFileSync(
    resolve(SRC, 'controllers/admin/admin-audit.controller.ts'),
    'utf8'
  );

  assert.match(controller, /audit\/admin-audit-read\.service/);
  assert.match(controller, /audit\/admin-audit-actors\.service/);

  const pharmacyActivity = read('admin-pharmacy-activity.service.ts');

  assert.match(pharmacyActivity, /\.\/admin-audit-read\.service/);
  assert.match(pharmacyActivity, /\.\/admin-audit-actors\.service/);

  const writer = [
    'admin-settings-category-mutation.service.ts',
    'admin-settings-position-mutation.service.ts',
  ]
    .map((name) =>
      readFileSync(resolve(SRC, 'services/admin/settings', name), 'utf8')
    )
    .join('\n');

  assert.match(writer, /audit\/admin-audit-write\.service/);

  const detail = readFileSync(
    resolve(
      SRC,
      'services/admin/pharmacies/admin-pharmacy-detail-read.service.ts'
    ),
    'utf8'
  );

  assert.match(detail, /audit\/admin-audit-filters/);

  for (const file of [controller, pharmacyActivity, writer, detail]) {
    assert.doesNotMatch(file, /admin-audit\.service/);
  }
});

//===============================================================

test('S10.9 audit modules have resolved local imports and no circular dependencies', () => {
  const canonical = new Set<string>(CANONICAL);
  const visiting = new Set<string>();
  const visited = new Set<string>();

  const walk = (file: string): void => {
    assert.ok(!visiting.has(file), `Audit dependency cycle: ${file}`);

    if (visited.has(file)) return;

    visiting.add(file);

    for (const match of read(file).matchAll(/from\s+['"](\.[^'"]+)['"]/g)) {
      const target = resolve(dirname(resolve(AUDIT_DIR, file)), match[1]);

      const resolved = [target + '.ts', resolve(target, 'index.ts')].find(
        existsSync
      );

      assert.ok(resolved, `Unresolved import ${match[1]} in ${file}`);

      if (
        dirname(resolved) === AUDIT_DIR &&
        canonical.has(basename(resolved))
      ) {
        walk(basename(resolved));
      }
    }

    visiting.delete(file);
    visited.add(file);
  };

  CANONICAL.forEach(walk);
  assert.equal(visited.size, CANONICAL.length);
});

//===============================================================

test('S10.9 normalization rejects sensitive values and writes audit in the caller transaction', () => {
  const normalization = read('admin-audit-normalization.ts');
  const write = read('admin-audit-write.service.ts');

  assert.match(normalization, /SENSITIVE_AUDIT_KEY_PATTERN/);
  assert.match(normalization, /passwordhash\|token\|accesstoken/);
  assert.match(normalization, /bankdetails\|iban\|taxid/);
  assert.match(normalization, /picture\|pictureurl\|photo\|photourl/);
  assert.match(normalization, /Array\.isArray\(value\)/);
  assert.match(normalization, /normalized\.length === 0/);
  assert.match(normalization, /\!\(field in before\) && \!\(field in after\)/);

  assert.match(write, /session: ClientSession/);

  assert.match(
    write,
    /User\.findById\(actorUserId\)[\s\S]*?\.session\(session\)/
  );

  assert.match(write, /AdminAuditLog\.create\([\s\S]*?\{ session \}/);
  assert.match(write, /mutationKey: normalizeAuditString/);
  assert.match(write, /scopeEntityType && scopeEntityId/);

  assert.match(
    write,
    /explicitPharmacyId\.toLowerCase\(\) !== derivedPharmacyId\.toLowerCase\(\)/
  );
});

//===============================================================

test('S10.9 exact pharmacy audit scope cannot match another pharmacy or an owner ID', () => {
  const filters = read('admin-audit-filters.ts');
  const actors = read('admin-audit-actors.service.ts');
  const history = read('admin-audit-read.service.ts');

  const scope =
    filters
      .split('export function buildPharmacyAuditScopeFilter(')[1]
      ?.split(
        '//==============================================================='
      )[0] ?? '';

  assert.match(scope, /pharmacyId: id/);

  assert.match(
    scope,
    /entityType: ADMIN_AUDIT_ENTITY_TYPES\.PHARMACY, entityId: id/
  );

  assert.match(
    scope,
    /scopeEntityType: ADMIN_AUDIT_ENTITY_TYPES\.PHARMACY,[\s\S]*?scopeEntityId: id/
  );

  assert.doesNotMatch(scope, /PHARMACY_OWNER/);

  assert.match(history, /filter\.\$and = \[exactPharmacyFilter\]/);

  assert.match(
    history,
    /scopeFilter: Record<string, unknown> = exactPharmacyFilter/
  );

  assert.match(
    history,
    /buildPharmacyAuditScopeFilter\(exactScope\.pharmacyId\)/
  );

  assert.match(history, /getAuditActorIdsByType\(query\.actorType\)/);
  assert.match(actors, /Pharmacy\.distinct\('ownerId'\)/);
  assert.match(actors, /AdminAuditLog\.distinct\('actorUserId'/);
  assert.match(actors, /Do not hide this actor from history/);
});

//===============================================================

test('S10.9 preserves legacy audit projection, filtering and paging metadata', () => {
  const projection = read('admin-audit-projection.ts');
  const filters = read('admin-audit-filters.ts');
  const history = read('admin-audit-read.service.ts');

  assert.match(projection, /normalizeStoredAdminAuditAction\(log\.action\)/);
  assert.match(projection, /getLegacyAuditSection\(log\.entityType\)/);
  assert.match(projection, /hasStatusChange/);
  assert.match(projection, /before: \{ \.\.\.log\.before \}/);
  assert.match(projection, /after: \{ \.\.\.log\.after \}/);
  assert.match(filters, /T00:00:00\.000Z/);
  assert.match(filters, /T23:59:59\.999Z/);
  assert.match(filters, /section: \{ \$exists: false \}/);

  assert.match(history, /AdminAuditLog\.countDocuments\(filter\)/);
  assert.match(history, /\.sort\(\{ createdAt: -1, _id: -1 \}\)/);

  assert.match(
    history,
    /AdminAuditLog\.findOne\(scopeFilter\)[\s\S]*?\.sort\(\{ createdAt: 1, _id: 1 \}\)/
  );

  assert.match(history, /AdminAuditLog\.distinct\('action', scopeFilter\)/);
  assert.match(history, /AdminAuditLog\.distinct\('section', scopeFilter\)/);
});
