import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import test from 'node:test';

//===================================================================

// S10.5: enforce canonical Product Request ownership without compatibility proxies.
const catalog = resolve(process.cwd(), 'src/services/catalog');

const read = (name: string): string =>
  readFileSync(resolve(catalog, name), 'utf8');

const files = [
  'product-request-read.service.ts',
  'product-request-management.service.ts',
  'product-request-moderation.service.ts',
  'product-request-access.ts',
  'product-request-articles.ts',
  'product-request-projection.ts',
] as const;

//===================================================================

test('S10.5 Product Request has no legacy proxy and controllers use direct domain services', () => {
  assert.equal(
    existsSync(resolve(catalog, 'product-request.service.ts')),
    false
  );

  for (const name of files) {
    const content = read(name);
    assert.ok(content.trim().length > 150, `${name} must own real code`);
    assert.doesNotMatch(content, /from ['"]\.\/product-request\.service['"]/);
  }

  const ownerController = readFileSync(
    resolve(process.cwd(), 'src/controllers/product-request.controller.ts'),
    'utf8'
  );

  const adminController = readFileSync(
    resolve(process.cwd(), 'src/controllers/admin.controller.ts'),
    'utf8'
  );

  assert.match(ownerController, /product-request-read\.service/);
  assert.match(ownerController, /product-request-management\.service/);
  assert.match(adminController, /product-request-moderation\.service/);

  assert.doesNotMatch(
    ownerController + adminController,
    /['"](?:\.\.\/)*[^'"]*\/product-request\.service['"]/
  );
});

//===================================================================

test('S10.5 Product Request modules form an acyclic graph with resolved local imports', () => {
  const graph = new Map<string, string[]>();

  for (const file of files) {
    const dependencies: string[] = [];
    const source = read(file);

    for (const match of source.matchAll(/from\s+['"](\.[^'"]+)['"]/g)) {
      const absolute = resolve(catalog, match[1]);

      const target = [
        absolute + '.ts',
        absolute + '.tsx',
        absolute + '/index.ts',
      ].find(existsSync);

      assert.ok(target, `unresolved import in ${file}: ${match[1]}`);

      if (
        target &&
        dirname(target) === catalog &&
        target.includes('/product-request-')
      ) {
        dependencies.push(target.split('/').at(-1)!);
      }
    }

    graph.set(file, dependencies);
  }

  const completed = new Set<string>();
  const visiting = new Set<string>();

  const visit = (file: string) => {
    assert.ok(
      !visiting.has(file),
      `circular Product Request import at ${file}`
    );

    if (completed.has(file)) return;

    visiting.add(file);

    for (const dep of graph.get(file) ?? []) visit(dep);

    visiting.delete(file);

    completed.add(file);
  };

  for (const file of files) visit(file);
});

//===================================================================

test('S10.5 pharmacy reads and writes preserve capability and scoped record ownership', () => {
  const access = read('product-request-access.ts');
  const readers = read('product-request-read.service.ts');
  const writers = read('product-request-management.service.ts');
  const articles = read('product-request-articles.ts');

  assert.match(access, /requirePharmacyCapability\(userId, capability\)/);
  assert.match(access, /'read_product_requests'/);
  assert.match(access, /'manage_product_requests'/);

  assert.match(
    writers,
    /getCurrentPharmacy\(userId, 'manage_product_requests'\)/
  );

  assert.match(writers, /pharmacyId[\s\S]*?request\.status !== 'draft'/);
  assert.match(readers, /pharmacyId: pharmacy\._id/);
  assert.match(readers, /getCurrentPharmacyId\(userId\)/);
  assert.match(articles, /Product\.exists/);
  assert.match(articles, /ProductRequest\.exists/);
  assert.match(writers, /isDuplicateProductRequestArticleError/);
});

//===================================================================

test('S10.5 deletes request and private notes transactionally and keeps inferred history explicit', () => {
  const writers = read('product-request-management.service.ts');
  const projection = read('product-request-projection.ts');

  const deleting = writers.slice(
    writers.indexOf('export async function deleteProductRequestService')
  );

  assert.match(deleting, /mongoose\.startSession\(\)/);
  assert.match(deleting, /session\.withTransaction/);

  assert.match(
    deleting,
    /ProductRequest\.deleteOne\([\s\S]*?\.session\(session\)/
  );

  assert.match(
    deleting,
    /PharmacyNote\.deleteMany\([\s\S]*?\.session\(session\)/
  );

  assert.match(deleting, /await session\.endSession\(\)/);
  assert.match(projection, /getFallbackHistory/);
  assert.match(projection, /isInferred: !hasPersistedHistory/);
});

//===================================================================

test('S10.5 moderation preserves transitions and atomic approved-product audit', () => {
  const moderation = read('product-request-moderation.service.ts');

  assert.match(
    moderation,
    /currentStatus === 'new'[\s\S]*?nextStatus === 'in_progress'/
  );

  assert.match(
    moderation,
    /currentStatus === 'in_progress'[\s\S]*?nextStatus === 'approved'/
  );

  assert.match(moderation, /session\.withTransaction/);
  assert.match(moderation, /resolveApprovedProduct\(/);
  assert.match(moderation, /Product\.create\([\s\S]*?\{ session \}/);
  assert.match(moderation, /request\.save\(\{ session \}\)/);
  assert.match(moderation, /appendAdminAuditLog\([\s\S]*?session,/);
  assert.match(moderation, /isDuplicateProductArticleError/);

  assert.match(
    moderation,
    /PRODUCT_REQUEST_ERROR_CODES\.APPROVAL_PRODUCT_CONFLICT/
  );
});
