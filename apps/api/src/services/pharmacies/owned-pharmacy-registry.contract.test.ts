import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

//===============================================================

const read = (path: string) => readFileSync(resolve(__dirname, path), 'utf8');

//===============================================================

test('Stage 14.18.8: every owned registry endpoint is private and validated', () => {
  const routes = read('../../routes/pharmacies/pharmacy.routes.ts');

  const controller = read(
    '../../controllers/pharmacies/pharmacy-registry.controller.ts'
  );

  const schema = read('../../schemas/owners/owned-pharmacy-registry.schema.ts');

  for (const [path, handler] of [
    ['/me/pharmacies', 'listOwnedPharmacies'],
    ['/me/pharmacies/summary', 'getOwnedPharmacyStatistics'],
    ['/me/pharmacies/options', 'listOwnedPharmacyOptions'],
    ['/me/pharmacies/:pharmacyId', 'getOwnedPharmacyDetail'],
  ]) {
    const index = routes.indexOf(`'${path}'`);

    assert.ok(index > 0, `Missing private route ${path}`);

    const route = routes.slice(index, index + 360);

    assert.match(route, /authenticate/);
    assert.match(route, /authorizeRoles\(USER_ROLES\.PHARMACY\)/);
    assert.match(route, /validate\(\{/);
    assert.ok(route.includes(`ctrlWrapper(${handler})`));
    assert.ok(controller.includes(`export async function ${handler}(`));
  }

  assert.ok(
    routes.indexOf("'/me/pharmacies/summary'") <
      routes.indexOf("'/me/pharmacies/:pharmacyId'")
  );

  assert.ok(
    routes.indexOf("'/me/pharmacies/:pharmacyId'") <
      routes.indexOf("'/:pharmacyId'")
  );

  assert.match(schema, /\.strict\(\)/);
  assert.doesNotMatch(schema, /ownerId:\s*optional/);
  assert.doesNotMatch(schema, /^\s+ownerSearch:/m);

  for (const property of [
    'pharmacySearch',
    'pharmacyId',
    'settlement',
    'region',
    'status',
    'createdFrom',
    'createdTo',
    'rating',
    'sort',
    'page',
    'perPage',
  ])
    assert.ok(
      schema.includes(`${property}:`) || schema.includes(`${property},`)
    );
});

//===============================================================

test('registry scopes aggregate before facet and reuses per-pharmacy KPI projection', () => {
  const service = read('./owned-pharmacy-registry-read.service.ts');

  assert.match(service, /async function assertRegistryUser\(/);
  assert.match(service, /function membershipStages\(userId: Types\.ObjectId\)/);
  assert.match(service, /\{ ownerId: userId \}, \{ managerUserIds: userId \}/);
  assert.match(service, /status: \{ \$ne: USER_STATUSES\.BLOCKED \}/);

  assert.match(
    service,
    /\.\.\.membershipStages\(userId\),\s*\{ \$match: registryFilters\(query\) \},\s*\{\s*\$facet:/
  );

  assert.match(service, /\.\.\.membershipStages\(userId\),\s*\{ \$group: /);

  assert.match(
    service,
    /\.\.\.membershipStages\(userId\),\s*\.\.\.\(query\.search/
  );

  assert.match(service, /buildPagedPharmacyItemsPipeline\(/);
  assert.match(service, /const safePage = /);
  assert.match(service, /getPharmacyMembership\(/);

  assert.match(
    service,
    /canPharmacyMembershipUseCapability\(membershipRole, 'read_profile'\)/
  );

  assert.match(
    service,
    /\$match: \{ _id: pharmacy\._id, ownerId: pharmacy\.ownerId \}/
  );

  assert.match(service, /serializePharmacyProfile\(pharmacy, membershipRole\)/);
  assert.match(service, /User\.exists\(\{\s*_id: pharmacy\.ownerId/);
  assert.doesNotMatch(service, /getAdminPharmacyDetailService\(/);
});
