import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

//===================================================================

// Each subdomain has exactly one canonical source; no legacy facade or barrel.
const MODULES = [
  'admin-pharmacy-owner-filters.ts',
  'admin-pharmacy-owner-registry.service.ts',
  'admin-pharmacy-owner-detail.service.ts',
  'admin-pharmacy-owner-pharmacies.service.ts',
  'admin-pharmacy-owner-activity.service.ts',
  'admin-pharmacy-owner-sales.service.ts',
  'admin-pharmacy-owner-sessions.service.ts',
] as const;

//===================================================================

function read(name: string): string {
  return readFileSync(resolve(__dirname, name), 'utf8');
}

//===================================================================

test('S10.6 owner read removes its monolith and imports canonical functions directly', () => {
  assert.equal(
    existsSync(resolve(__dirname, 'admin-pharmacy-owner-read.service.ts')),
    false
  );

  const controller = read('../../../controllers/admin/admin.controller.ts');

  const contracts = [
    [
      'getAdminPharmacyOwnerDetailService',
      'admin-pharmacy-owner-detail.service',
    ],
    [
      'getAdminPharmacyOwnerSalesStatisticsService',
      'admin-pharmacy-owner-sales.service',
    ],
    [
      'listAdminPharmacyOwnerSessionsService',
      'admin-pharmacy-owner-sessions.service',
    ],
    ['listAdminPharmacyOwnersService', 'admin-pharmacy-owner-registry.service'],
    [
      'listAdminPharmacyOwnerPharmaciesService',
      'admin-pharmacy-owner-pharmacies.service',
    ],
    [
      'listAdminPharmacyOwnerActivityService',
      'admin-pharmacy-owner-activity.service',
    ],
  ] as const;

  for (const [name, path] of contracts) {
    assert.match(controller, new RegExp(`\\b${name}\\b`));
    assert.ok(controller.includes(`../services/admin/owners/${path}`));
  }

  assert.doesNotMatch(controller, /admin-pharmacy-owner-read\.service/);
});

//===================================================================

test('S10.6 owner modules are connected without cycles, missing paths, or re-export proxies', () => {
  const graph = new Map<string, string[]>();

  for (const name of MODULES) {
    const source = read(name);
    const dependencies: string[] = [];

    assert.doesNotMatch(source, /export\s*\*\s*from/);

    for (const match of source.matchAll(/from\s+['"](\.[^'"]+)['"]/g)) {
      const target = resolve(__dirname, match[1]);

      assert.ok(
        existsSync(`${target}.ts`) ||
          existsSync(`${target}.tsx`) ||
          existsSync(target),
        `${name}: ${match[1]}`
      );

      const local = MODULES.find(
        (candidate) => resolve(__dirname, candidate) === `${target}.ts`
      );

      if (local) dependencies.push(local);
    }

    graph.set(name, dependencies);
  }

  const visited = new Set<string>();
  const active = new Set<string>();

  function visit(name: string) {
    assert.ok(!active.has(name), `circular import: ${name}`);

    if (visited.has(name)) return;

    active.add(name);

    for (const dependency of graph.get(name) ?? []) visit(dependency);

    active.delete(name);
    visited.add(name);
  }

  for (const name of MODULES) visit(name);
});

//===================================================================

test('S10.6 registry keeps owner-only aggregation, scoped pharmacy metrics and no N+1', () => {
  const registry = read('admin-pharmacy-owner-registry.service.ts');
  const linked = read('admin-pharmacy-owner-pharmacies.service.ts');
  const filters = read('admin-pharmacy-owner-filters.ts');

  assert.match(registry, /User\.aggregate<OwnerListAggregateResult>/);
  assert.match(registry, /\$lookup:[\s\S]*?Pharmacy\.collection\.name/);
  assert.match(registry, /\$facet:[\s\S]*?items: itemPipeline/);

  assert.doesNotMatch(
    registry,
    /(?:for\s*\([^)]*owner|owners\.map\()[\s\S]{0,300}Pharmacy\.(?:find|count)/
  );

  assert.match(linked, /buildPharmacyMatch\(ownerObjectId, query\)/);
  assert.match(filters, /const match: Record<string, unknown> = \{ ownerId \}/);

  assert.match(
    linked,
    /buildPagedPharmacyItemsPipeline\(skip, query\.perPage\)/
  );

  assert.doesNotMatch(linked, /Pharmacy\.findOne\(\{\s*ownerId/);
});

//===================================================================

test('S10.6 owner detail, activity, sales and sessions preserve access and privacy', () => {
  const detail = read('admin-pharmacy-owner-detail.service.ts');
  const activity = read('admin-pharmacy-owner-activity.service.ts');
  const sales = read('admin-pharmacy-owner-sales.service.ts');
  const sessions = read('admin-pharmacy-owner-sessions.service.ts');

  assert.match(detail, /PharmacyOwnerDocument\.collection\.name/);
  assert.match(detail, /PharmacyOwnerAdminComment\.collection\.name/);

  assert.match(
    activity,
    /listAdminAuditLogsService\(\{[\s\S]*?scopeEntityType: ADMIN_AUDIT_ENTITY_TYPES\.PHARMACY_OWNER/
  );

  assert.match(activity, /scopeEntityId: ownerId/);
  assert.match(sales, /Pharmacy\.find\(\{ ownerId: ownerObjectId \}\)/);
  assert.match(sales, /getOrderSalesStatisticsForPharmaciesService/);
  assert.match(sessions, /roleAtLogin: USER_ROLES\.PHARMACY/);
  assert.match(sessions, /\.limit\(200\)/);

  assert.doesNotMatch(
    sessions,
    /(?:refreshTokenHash|accessTokenHash|passwordHash)/
  );
});
