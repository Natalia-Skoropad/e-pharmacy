import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

//===============================================================

const read = (relativePath: string) =>
  readFileSync(resolve(__dirname, relativePath), 'utf8');

//===============================================================

test('Stage 14.4 exposes three view-only routes with strict schema validation', () => {
  const routes = read('../../../routes/admin/admin.routes.ts');
  const schema = read('../../../schemas/admin-pharmacy-registry.schema.ts');
  const controller = read('../../../controllers/admin/admin.controller.ts');

  for (const route of [
    '/pharmacies',
    '/pharmacies/summary',
    '/pharmacies/options',
  ]) {
    const start = routes.indexOf(`'${route}'`);

    assert.ok(start > 0);

    assert.match(
      routes.slice(start, start + 250),
      /ADMIN_PERMISSIONS\.pharmacies\.view/
    );
  }

  for (const field of [
    'pharmacySearch',
    'ownerSearch',
    'pharmacyId',
    'ownerId',
    'status',
    'createdFrom',
    'createdTo',
    'rating',
    'sort',
    'page',
    'perPage',
  ]) {
    assert.match(schema, new RegExp(`${field}:`));
  }

  assert.match(schema, /\.strict\(\)/);
  assert.match(controller, /getAdminPharmacyStatisticsService/);
});

//===============================================================

test('registry joins owner identity before filtering, but metrics after pagination', () => {
  const service = read('./admin-pharmacy-registry-read.service.ts');
  const pipeline = read('../../pharmacies/registry/pharmacy-registry-query.ts');

  assert.match(service, /ownerSearchStages\(query\.ownerSearch\)/);
  assert.match(service, /buildPagedPharmacyItemsPipeline\(/);
  assert.match(service, /pipeline\[0\] = \{ \$sort:/);
  assert.match(service, /\$lookup:[\s\S]*?User\.collection\.name/);
  assert.match(pipeline, /\$eq: \[['"]\$status['"], ['"]successful['"]\]/);
  assert.match(pipeline, /defaultClientPharmacyId/);
  assert.match(service, /\$facet:[\s\S]*?total: \[\{ \$count: 'count' \}\]/);
  assert.match(service, /safePage !== page/);
});

//===============================================================

test('registry ratings cover the complete [0, 5] domain without gaps', () => {
  const service = read('./admin-pharmacy-registry-read.service.ts');

  const bounds = read(
    '../../pharmacies/registry/pharmacy-registry.constants.ts'
  );

  assert.match(service, /RATING_BOUNDS\[query\.rating\]/);

  for (const [key, min, max] of [
    ['0-0.9', '0', '1'],
    ['1-1.9', '1', '2'],
    ['2-2.9', '2', '3'],
    ['3-3.9', '3', '4'],
    ['4-5', '4', '5'],
  ]) {
    assert.ok(bounds.includes(`'${key}': { min: ${min}, max: ${max},`));
  }

  assert.match(service, /inclusiveMax \? \{ \$lte:/);
  assert.match(service, /: \{ \$lt:/);
});

//===============================================================

test('admin BFF registry routes remain present when Stage 14.5 backend detail is added', () => {
  const root = '../../../../../../';

  for (const file of [
    'apps/admin/src/app/api/admin/pharmacies/route.ts',
    'apps/admin/src/app/api/admin/pharmacies/summary/route.ts',
    'apps/admin/src/app/api/admin/pharmacies/options/route.ts',
  ]) {
    assert.match(read(root + file), /createPrivateProxyRoute/);
  }

  const routes = read('../../../routes/admin/admin.routes.ts');

  assert.match(routes, /'\/pharmacies\/:pharmacyId'/);
  assert.match(routes, /ctrlWrapper\(getPharmacyDetailByAdmin\)/);

  // Stage 14.14 legitimately introduced pharmacy comments after Stage 14.5.
  assert.match(
    routes,
    /'\/pharmacies\/:pharmacyId\/comments',\s*requireAdminPermission\(ADMIN_PERMISSIONS\.pharmacies\.view\)/
  );
});
