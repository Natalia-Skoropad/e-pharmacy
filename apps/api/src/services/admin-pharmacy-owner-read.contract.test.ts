import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

//===================================================================

function read(relativePath: string): string {
  return readFileSync(resolve(__dirname, relativePath), 'utf8');
}

//===================================================================

test('pharmacy-owner read routes are view-permission protected and expose the Stage 13.3 endpoints', () => {
  const routes = read('../routes/admin.routes.ts');

  for (const route of [
    '/pharmacy-owners',
    '/pharmacy-owners/summary',
    '/pharmacy-owners/options',
    '/pharmacy-owners/:ownerId',
    '/pharmacy-owners/:ownerId/pharmacies',
    '/pharmacy-owners/:ownerId/activity',
  ]) {
    const escaped = route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    assert.match(
      routes,
      new RegExp(
        `get\\(\\s*['\"]${escaped}['\"][\\s\\S]*?ADMIN_PERMISSIONS\\.pharmacyOwners\\.view`
      )
    );
  }
});

//===================================================================

test('shared Pharmacy Owners read contracts are exported from the admin types entrypoint', () => {
  const contracts = read(
    '../../../../packages/types/src/admin/pharmacy-owner.ts'
  );

  const index = read('../../../../packages/types/src/admin/index.ts');

  for (const typeName of [
    'AdminPharmacyOwnerListItem',
    'AdminPharmacyOwnerListResponse',
    'AdminPharmacyOwnerStatistics',
    'AdminPharmacyOwnerOption',
    'AdminPharmacyOwnerDetail',
    'AdminPharmacyOwnerPharmacySummary',
    'AdminPharmacyOwnerPharmaciesResponse',
  ]) {
    assert.match(contracts, new RegExp(`export type ${typeName}\\b`));
  }

  assert.match(index, /export type \* from ['"]\.\/pharmacy-owner['"]/);
});

//===================================================================

test('owner and pharmacy list queries are pagination-aware and include the Stage 13.3 filters', () => {
  const schema = read('../schemas/admin-pharmacy-owner.schema.ts');

  assert.match(schema, /adminPharmacyOwnerListQuerySchema/);
  assert.match(schema, /search: adminOwnerSearchSchema/);
  assert.match(schema, /registeredFrom: dateQuerySchema/);
  assert.match(schema, /registeredTo: dateQuerySchema/);
  assert.match(schema, /status: adminOwnerStatusQuerySchema/);
  assert.match(schema, /page: positivePageSchema/);
  assert.match(schema, /perPage: adminOwnerPerPageSchema/);

  assert.match(schema, /adminPharmacyOwnerPharmaciesQuerySchema/);
  assert.match(schema, /createdFrom: dateQuerySchema/);
  assert.match(schema, /createdTo: dateQuerySchema/);
  assert.match(schema, /status: adminPharmacyStatusQuerySchema/);
  assert.match(schema, /rating: adminPharmacyRatingQuerySchema/);

  assert.match(schema, /adminPharmacyOwnerActivityQuerySchema/);
});

//===================================================================

test('owner list aggregates linked pharmacy counts without application-level N+1 queries', () => {
  const service = read('./admin-pharmacy-owner-read.service.ts');

  assert.match(
    service,
    /listAdminPharmacyOwnersService[\s\S]*?User\.aggregate<OwnerListAggregateResult>[\s\S]*?\$lookup:[\s\S]*?Pharmacy\.collection\.name/
  );

  assert.doesNotMatch(
    service,
    /listAdminPharmacyOwnersService[\s\S]*?(?:for\s*\([^)]*owner|\.map\([^)]*=>[\s\S]{0,300}Pharmacy\.(?:find|count))/
  );
});

//===================================================================

test('operating and non-working pharmacy definitions match the canonical Stage 13 contract', () => {
  const service = read('./admin-pharmacy-owner-read.service.ts');

  assert.match(
    service,
    /OPERATING_PHARMACY_STATUSES\s*=\s*\[\s*PHARMACY_STATUSES\.ACTIVE,\s*PHARMACY_STATUSES\.ON_MODERATION/
  );

  assert.match(
    service,
    /NON_WORKING_PHARMACY_STATUSES\s*=\s*\[\s*PHARMACY_STATUSES\.NEW,\s*PHARMACY_STATUSES\.ON_VERIFICATION,\s*PHARMACY_STATUSES\.BLOCKED/
  );
});

//===================================================================

test('linked pharmacy statistics count only successful orders and sum canonical totalPrice', () => {
  const service = read('./admin-pharmacy-owner-read.service.ts');

  assert.match(
    service,
    /successful:\s*\[[\s\S]*?\$match:\s*\{ status: ['"]successful['"] \}[\s\S]*?count:\s*\{ \$sum: 1 \}[\s\S]*?revenue:\s*\{ \$sum: ['"]\$totalPrice['"] \}/
  );

  assert.doesNotMatch(
    service,
    /revenue:\s*\{ \$sum: ['"]\$items\.totalPrice['"] \}/
  );
});

//===================================================================

test('active client aggregation keeps the pharmacy Clients domain definition including the default walk-in client', () => {
  const service = read('./admin-pharmacy-owner-read.service.ts');

  assert.match(service, /\{ \$group: \{ _id: ['"]\$userId['"] \} \}/);
  assert.match(service, /isDefaultPharmacyClient/);

  assert.match(
    service,
    /\$ne: \[['"]\$user\.status['"], USER_STATUSES\.BLOCKED\]/
  );

  assert.match(service, /defaultClientPharmacyId/);
  assert.match(service, /orderClientIds/);
});

//===================================================================

test('rating filters use the exact stable Stage 13.3 bounds', () => {
  const service = read('./admin-pharmacy-owner-read.service.ts');
  const schema = read('../schemas/admin-pharmacy-owner.schema.ts');

  for (const [filter, min, max] of [
    ['0-0.9', '0', '0.9'],
    ['1-1.9', '1', '1.9'],
    ['2-2.9', '2', '2.9'],
    ['3-3.9', '3', '3.9'],
    ['4-5', '4', '5'],
  ] as const) {
    assert.match(schema, new RegExp(`['\"]${filter}['\"]`));
    assert.match(
      service,
      new RegExp(
        `['\"]${filter}['\"]:\\s*\\{ min: ${min.replace('.', '\\.')}, max: ${max.replace('.', '\\.')} \\}`
      )
    );
  }
});

//===================================================================

test('owner detail and linked-pharmacy reads support one owner with many pharmacies', () => {
  const service = read('./admin-pharmacy-owner-read.service.ts');

  assert.match(
    service,
    /getAdminPharmacyOwnerDetailService[\s\S]*?\$lookup:[\s\S]*?\$eq: \[['"]\$ownerId['"], ['"]\$\$ownerId['"]\][\s\S]*?\$group/
  );

  assert.match(
    service,
    /listAdminPharmacyOwnerPharmaciesService[\s\S]*?Pharmacy\.aggregate<OwnerPharmaciesAggregateResult>/
  );

  assert.doesNotMatch(
    service,
    /listAdminPharmacyOwnerPharmaciesService[\s\S]*?Pharmacy\.findOne\(\{\s*ownerId/
  );
});

//===================================================================

test('linked pharmacy admin read model exposes canonical location instead of address/city aliases', () => {
  const service = read('./admin-pharmacy-owner-read.service.ts');
  const contracts = read(
    '../../../../packages/types/src/admin/pharmacy-owner.ts'
  );

  assert.match(contracts, /location\?: PharmacyLocationDraft/);
  assert.doesNotMatch(contracts, /\bcity\?: string/);

  assert.match(
    service,
    /location: \{ \$ifNull: \[['"]\$location['"], null\] \}/
  );

  assert.match(
    service,
    /pharmacy\.location \? \{ location: pharmacy\.location \} : \{\}/
  );

  assert.doesNotMatch(
    service,
    /city: \{ \$ifNull: \[['"]\$location\.settlement/
  );
});

//===================================================================

test('owner activity reuses canonical audit logs while preserving pharmacyOwners.view permission', () => {
  const routes = read('../routes/admin.routes.ts');
  const service = read('./admin-pharmacy-owner-read.service.ts');

  assert.match(
    routes,
    /get\(\s*['"]\/pharmacy-owners\/:ownerId\/activity['"][\s\S]*?ADMIN_PERMISSIONS\.pharmacyOwners\.view/
  );

  assert.match(
    service,
    /listAdminPharmacyOwnerActivityService[\s\S]*?listAdminAuditLogsService\(\{[\s\S]*?scopeEntityType:\s*ADMIN_AUDIT_ENTITY_TYPES\.PHARMACY_OWNER[\s\S]*?scopeEntityId:\s*ownerId/
  );
});
