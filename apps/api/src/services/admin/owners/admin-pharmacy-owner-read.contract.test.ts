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
  const routes = read('../../../routes/admin.routes.ts');

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
    '../../../../../../packages/types/src/admin/pharmacy-owner.ts'
  );

  const index = read('../../../../../../packages/types/src/admin/index.ts');

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
  const schema = read('../../../schemas/admin-pharmacy-owner.schema.ts');

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
  const service = read('./admin-pharmacy-owner-registry.service.ts');

  assert.match(
    service,
    /listAdminPharmacyOwnersService[\s\S]*?\$lookup:[\s\S]*?Pharmacy\.collection\.name/
  );

  assert.match(service, /User\.aggregate<OwnerListAggregateResult>/);

  assert.doesNotMatch(
    service,
    /listAdminPharmacyOwnersService[\s\S]*?(?:for\s*\([^)]*owner|\.map\([^)]*=>[\s\S]{0,300}Pharmacy\.(?:find|count))/
  );
});

//===================================================================

test('operating and non-working pharmacy definitions match the canonical Stage 13 contract', () => {
  const service = read('./admin-pharmacy-owner-filters.ts');

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

test('linked pharmacy metrics use a single group and count only successful orders', () => {
  const service = read('../../pharmacies/registry/pharmacy-registry-query.ts');

  assert.match(
    service,
    /successfulOrdersCount:\s*\{\s*\$sum:\s*\{\s*\$cond:\s*\[\{ \$eq: \[['"]\$status['"], ['"]successful['"]\] \}, 1, 0\]/
  );

  assert.match(
    service,
    /successfulRevenue:\s*\{\s*\$sum:\s*\{\s*\$cond:\s*\[\{ \$eq: \[['"]\$status['"], ['"]successful['"]\] \}, ['"]\$totalPrice['"], 0\]/
  );

  assert.doesNotMatch(
    service,
    /revenue:\s*\{ \$sum: ['"]\$items\.totalPrice['"] \}/
  );
});

//===================================================================

test('pharmacy list aggregation does not nest $facet inside the pagination $facet', () => {
  const service = read('../../pharmacies/registry/pharmacy-registry-query.ts');

  const sharedPagePipeline = service.slice(
    service.indexOf('export function buildPagedPharmacyItemsPipeline')
  );

  // Both the global registry and owner-linked list call this shared pipeline
  // from within their pagination $facet. MongoDB rejects a nested $facet even
  // when it is hidden inside an order $lookup pipeline.
  assert.doesNotMatch(sharedPagePipeline, /^\s*\$facet\s*:/m);

  assert.match(
    sharedPagePipeline,
    /orderClientIds: \{ \$addToSet: ['"]\$userId['"] \}/
  );

  assert.match(sharedPagePipeline, /localField: ['"]orderClientIds['"]/);
  assert.match(sharedPagePipeline, /foreignField: ['"]_id['"]/);
  assert.match(sharedPagePipeline, /isDefaultPharmacyClient: true/);
  assert.match(sharedPagePipeline, /\$ne: USER_STATUSES\.BLOCKED/);
  assert.match(sharedPagePipeline, /defaultClientPharmacyId/);

  assert.match(
    sharedPagePipeline,
    /\$ifNull: \[['"]\$orderStatistics\.activeOrderClientsCount['"], 0\]/
  );
});

//===================================================================

test('active client aggregation keeps the pharmacy Clients domain definition including the default walk-in client', () => {
  const service = read('../../pharmacies/registry/pharmacy-registry-query.ts');

  assert.match(service, /orderClientIds: \{ \$addToSet: ['"]\$userId['"] \}/);
  assert.match(service, /isDefaultPharmacyClient/);

  assert.match(service, /status: \{ \$ne: USER_STATUSES\.BLOCKED \}/);

  assert.match(service, /defaultClientPharmacyId/);
  assert.match(service, /orderClientIds/);
});

//===================================================================

test('owner linked-pharmacy rating filters have gapless numeric bounds', () => {
  const service = read('./admin-pharmacy-owner-filters.ts');

  const shared = read(
    '../../pharmacies/registry/pharmacy-registry.constants.ts'
  );

  const schema = read('../../../schemas/admin-pharmacy-owner.schema.ts');

  for (const [filter, min, max] of [
    ['0-0.9', '0', '1'],
    ['1-1.9', '1', '2'],
    ['2-2.9', '2', '3'],
    ['3-3.9', '3', '4'],
    ['4-5', '4', '5'],
  ] as const) {
    assert.match(schema, new RegExp(`['"]${filter}['"]`));
    assert.ok(shared.includes(`'${filter}': { min: ${min}, max: ${max},`));
  }

  assert.match(service, /bounds\.inclusiveMax/);
});

//===================================================================

test('owner detail and linked-pharmacy reads support one owner with many pharmacies', () => {
  const service = read('./admin-pharmacy-owner-detail.service.ts');

  assert.match(
    service,
    /getAdminPharmacyOwnerDetailService[\s\S]*?\$lookup:[\s\S]*?\$eq: \[['"]\$ownerId['"], ['"]\$\$ownerId['"]\][\s\S]*?\$group/
  );

  const pharmaciesService = read(
    './admin-pharmacy-owner-pharmacies.service.ts'
  );

  assert.match(
    pharmaciesService,
    /listAdminPharmacyOwnerPharmaciesService[\s\S]*?Pharmacy\.aggregate<OwnerPharmaciesAggregateResult>/
  );

  assert.doesNotMatch(
    pharmaciesService,
    /listAdminPharmacyOwnerPharmaciesService[\s\S]*?Pharmacy\.findOne\(\{\s*ownerId/
  );
});

//===================================================================

test('linked pharmacy admin read model exposes canonical location instead of address/city aliases', () => {
  const service = read('./admin-pharmacy-owner-pharmacies.service.ts');
  const pipeline = read('../../pharmacies/registry/pharmacy-registry-query.ts');

  const contracts = read(
    '../../../../../../packages/types/src/admin/pharmacy-owner.ts'
  );

  assert.match(contracts, /location\?: PharmacyLocationDraft/);
  assert.doesNotMatch(contracts, /\bcity\?: string/);

  assert.match(
    pipeline,
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
  const routes = read('../../../routes/admin.routes.ts');
  const service = read('./admin-pharmacy-owner-activity.service.ts');

  assert.match(
    routes,
    /get\(\s*['"]\/pharmacy-owners\/:ownerId\/activity['"][\s\S]*?ADMIN_PERMISSIONS\.pharmacyOwners\.view/
  );

  assert.match(
    service,
    /listAdminPharmacyOwnerActivityService[\s\S]*?listAdminAuditLogsService\(\{[\s\S]*?scopeEntityType:\s*ADMIN_AUDIT_ENTITY_TYPES\.PHARMACY_OWNER[\s\S]*?scopeEntityId:\s*ownerId/
  );
});

//===================================================================

test('owner detail bootstrap returns tab counts without loading tab lists', () => {
  const service = read('./admin-pharmacy-owner-detail.service.ts');

  const contracts = read(
    '../../../../../../packages/types/src/admin/pharmacy-owner.ts'
  );

  assert.match(
    contracts,
    /tabCounts:\s*Readonly<\{[\s\S]*?pharmacies: number;[\s\S]*?documents: number;[\s\S]*?comments: number;/
  );

  assert.match(
    service,
    /getAdminPharmacyOwnerDetailService[\s\S]*?PharmacyOwnerDocument\.collection\.name[\s\S]*?PharmacyOwnerAdminComment\.collection\.name[\s\S]*?tabCounts/
  );

  assert.match(service, /pharmacies: ['"]\$pharmacyStatistics\.all['"]/);

  assert.match(
    service,
    /documents:[\s\S]*?\$arrayElemAt: \[['"]\$documentCount\.count['"], 0\]/
  );

  assert.match(
    service,
    /comments:[\s\S]*?\$arrayElemAt: \[['"]\$commentCount\.count['"], 0\]/
  );
});

//===================================================================

test('owner detail derives the last personal-data change from owner profile/photo audit rather than account status updates', () => {
  const service = read('./admin-pharmacy-owner-detail.service.ts');

  assert.match(
    service,
    /getAdminPharmacyOwnerDetailService[\s\S]*?AdminAuditLog\.collection\.name[\s\S]*?PHARMACY_OWNER_ACCOUNT_CREATED[\s\S]*?PHARMACY_OWNER_PROFILE_UPDATED[\s\S]*?PHARMACY_OWNER_PHOTO_UPDATED/
  );

  const detailSection = service.slice(
    service.indexOf('export async function getAdminPharmacyOwnerDetailService'),

    service.length
  );

  assert.doesNotMatch(
    detailSection,
    /lastPersonalDataUpdateAt:\s*['"]\$updatedAt['"]/
  );
});
