import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

//===============================================================

const read = (path: string) =>
  readFileSync(resolve(process.cwd(), 'src/services', path), 'utf8');

//===============================================================

test('shared pharmacy KPI pipeline is neutral and always paginates before metric lookups', () => {
  const query = read('pharmacies/registry/pharmacy-registry-query.ts');

  const pipeline = query.slice(
    query.indexOf('export function buildPagedPharmacyItemsPipeline')
  );

  const sort = pipeline.indexOf('$sort:');
  const skip = pipeline.indexOf('$skip:');
  const limit = pipeline.indexOf('$limit:');
  const lookup = pipeline.indexOf('$lookup:');

  assert.ok(sort >= 0 && sort < skip && skip < limit && limit < lookup);

  assert.doesNotMatch(query, /\$facet\s*:/);
  assert.match(query, /orderClientIds: \{ \$addToSet: '\$userId' \}/);
  assert.match(query, /defaultClientPharmacyId/);
  assert.match(query, /USER_STATUSES\.BLOCKED/);
  assert.match(query, /successfulOrdersCount/);
  assert.match(query, /successfulRevenue/);
  assert.match(query, /includeOwnerId \? \{ ownerId: 1 \}/);

  assert.doesNotMatch(
    query,
    /admin-[a-z]|membershipStages|assertRegistryUser|ownerSearchStages/
  );
});

//===============================================================

test('each caller retains its own access scope, before entering shared KPI projection', () => {
  const admin = read(
    'admin/pharmacies/admin-pharmacy-registry-read.service.ts'
  );

  const owned = read('pharmacies/owned-pharmacy-registry-read.service.ts');
  const owner = read('admin/owners/admin-pharmacy-owner-pharmacies.service.ts');
  const detail = read('admin/pharmacies/admin-pharmacy-detail-read.service.ts');

  for (const service of [admin, owned, owner, detail]) {
    assert.match(service, /pharmacy-registry-query/);
    assert.match(service, /buildPagedPharmacyItemsPipeline\(/);
  }

  assert.match(admin, /ownerSearchStages\(query\.ownerSearch\)/);
  assert.match(owned, /\.\.\.membershipStages\(userId\)/);
  assert.match(owned, /assertRegistryUser\(/);

  const ownerFilters = read('admin/owners/admin-pharmacy-owner-filters.ts');

  assert.match(owner, /buildPharmacyMatch\(ownerObjectId, query\)/);

  assert.match(
    ownerFilters,
    /const match: Record<string, unknown> = \{ ownerId \}/
  );

  assert.doesNotMatch(owned, /admin-pharmacy-owner-read\.service/);
});
