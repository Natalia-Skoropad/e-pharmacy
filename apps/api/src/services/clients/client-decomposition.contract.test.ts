import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';
import test from 'node:test';

//===============================================================

const ROOT = resolve(process.cwd(), 'src');
const CLIENTS_DIR = resolve(ROOT, 'services/clients');

const CANONICAL = [
  'client-types.ts',
  'client-access.ts',
  'client-registry-filters.ts',
  'client-registry-aggregation.ts',
  'client-registry.service.ts',
  'client-purchases-aggregation.ts',
  'client-purchases.service.ts',
] as const;

//===============================================================

function read(fileName: string) {
  return readFileSync(resolve(CLIENTS_DIR, fileName), 'utf8');
}

//===============================================================

test('S10.8 removes Client monolith and uses direct canonical imports', () => {
  assert.equal(existsSync(resolve(CLIENTS_DIR, 'client.service.ts')), false);

  for (const fileName of CANONICAL) {
    const source = read(fileName);

    assert.ok(
      source.trim().length > 100,
      `${fileName} must own behavior/types`
    );

    assert.doesNotMatch(source, /export\s+\*\s+from\s+/);
    assert.doesNotMatch(source, /^export\s+\{[^}]+\}\s+from\s+/m);
  }

  const controller = readFileSync(
    resolve(ROOT, 'controllers/clients/client.controller.ts'),
    'utf8'
  );

  assert.match(controller, /clients\/client-registry\.service'/);
  assert.match(controller, /clients\/client-purchases\.service'/);
  assert.doesNotMatch(controller, /clients\/client\.service'/);

  for (const name of [
    'client-service.mongo.integration.test.ts',
    'client-tenant-isolation.mongo.integration.test.ts',
  ]) {
    const source = read(name);

    assert.match(source, /'\.\/client-registry\.service'/);
    assert.match(source, /'\.\/client-purchases\.service'/);
    assert.doesNotMatch(source, /'\.\/client\.service'/);
  }
});

//===============================================================

test('S10.8 canonical client modules resolve locally and remain acyclic', () => {
  const visiting = new Set<string>();
  const visited = new Set<string>();

  function walk(fileName: string): void {
    assert.ok(existsSync(resolve(CLIENTS_DIR, fileName)), fileName);

    assert.ok(
      !visiting.has(fileName),
      `Circular client dependency: ${fileName}`
    );

    if (visited.has(fileName)) return;

    visiting.add(fileName);

    const source = read(fileName);

    for (const match of source.matchAll(/from\s+['"](\.[^'"]+)['"]/g)) {
      const target = resolve(dirname(resolve(CLIENTS_DIR, fileName)), match[1]);

      const resolved = [target + '.ts', resolve(target, 'index.ts')].find(
        existsSync
      );

      assert.ok(resolved, `Missing import ${match[1]} in ${fileName}`);

      if (dirname(resolved) === CLIENTS_DIR) {
        walk(basename(resolved));
      }
    }

    visiting.delete(fileName);
    visited.add(fileName);
  }

  CANONICAL.forEach(walk);
  assert.equal(visited.size, CANONICAL.length);
});

//===============================================================

test('S10.8 capability boundary stays shared and fails closed for blocked memberships', () => {
  const access = read('client-access.ts');
  const registry = read('client-registry.service.ts');
  const purchases = read('client-purchases.service.ts');

  assert.match(access, /requirePharmacyCapability\([\s\S]*?'read_clients'/);

  assert.match(
    access,
    /if \(isPharmacyMembershipMissing\(error\)\) return null/
  );

  assert.match(access, /throw error/);
  assert.match(registry, /await getCurrentPharmacyId\(userId\)/);
  assert.match(purchases, /await getCurrentPharmacyId\(userId\)/);
  assert.match(purchases, /!Types\.ObjectId\.isValid\(clientId\)/);
  assert.match(registry, /httpError\(HTTP_STATUS\.NOT_FOUND/);
});

//===============================================================

test('S10.8 registry retains per-pharmacy Mongo facet and true Walk-in identity', () => {
  const filters = read('client-registry-filters.ts');
  const aggregation = read('client-registry-aggregation.ts');
  const registry = read('client-registry.service.ts');

  assert.match(aggregation, /\{ \$match: \{ pharmacyId \} \}/);

  assert.match(
    aggregation,
    /Order\.aggregate<ClientAggregationResult>\(pipeline\)/
  );

  assert.match(
    aggregation,
    /\$facet:[\s\S]*?items: itemsFacet,[\s\S]*?total: totalFacet,[\s\S]*?statistics: statisticsFacet/
  );

  assert.match(
    aggregation,
    /\$eq: \['\$user\.isDefaultPharmacyClient', true\]/
  );

  assert.match(aggregation, /'Walk-in client'/);
  assert.match(aggregation, /firstOrderAt: \{ \$min: '\$createdAt' \}/);
  assert.match(aggregation, /successfulOrdersAmount:/);
  assert.match(filters, /match\.firstOrderAt\s*=\s*\{/);
  assert.match(filters, /createSafeRegExp\(query\.contact\.trim\(\)\)/);
  assert.match(registry, /if \(page !== query\.page\)/);
  assert.doesNotMatch(aggregation, /Order\.find\(/);
});

//===============================================================

test('S10.8 purchases retain immutable product snapshots and Mongo pagination', () => {
  const aggregation = read('client-purchases-aggregation.ts');
  const purchases = read('client-purchases.service.ts');

  assert.match(aggregation, /status: 'successful'/);
  assert.match(aggregation, /'\$items\.productSnapshot\.article'/);
  assert.match(aggregation, /'\$items\.productSnapshot\.name'/);
  assert.match(aggregation, /'\$items\.productSnapshot\.categoryNameSnapshot'/);
  assert.match(aggregation, /from: Product\.collection\.name/);
  assert.match(aggregation, /currentProductExists:/);
  assert.match(aggregation, /\{ \$skip: skip \}/);
  assert.match(aggregation, /metadata: metadataFacet/);

  assert.match(
    purchases,
    /Order\.aggregate<ClientPurchasedProductsAggregationResult>/
  );

  assert.match(purchases, /if \(page !== query\.page\)/);
  assert.match(purchases, /Order\.exists\(/);
  assert.match(purchases, /User\.exists\(/);
  assert.doesNotMatch(aggregation, /currentProduct\?\.(?:name|article)/);
});
