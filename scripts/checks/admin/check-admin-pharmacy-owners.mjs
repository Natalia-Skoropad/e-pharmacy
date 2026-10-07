import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

//===================================================================

const ROOT_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  '..'
);

const read = (...segments) =>
  readFile(path.join(ROOT_DIR, ...segments), 'utf8');

//===================================================================

const [
  apiRoutes,
  ownerReadService,
  ownerDocumentService,
  ownerDocumentRoutes,
  ownerCommentService,
  ownerRoutes,
  browserApi,
  ownerParser,
  ownerSchema,
  navigation,
  sidebar,
  mobileMenu,
  badgeProvider,
  ownersPage,
  linkedPharmaciesTab,
] = await Promise.all([
  read('apps', 'api', 'src', 'routes', 'admin.routes.ts'),

  read(
    'apps',
    'api',
    'src',
    'services',
    'admin-pharmacy-owner-read.service.ts'
  ),

  read('apps', 'api', 'src', 'services', 'pharmacy-owner-document.service.ts'),
  read('apps', 'api', 'src', 'routes', 'admin.routes.ts'),

  read(
    'apps',
    'api',
    'src',
    'services',
    'pharmacy-owner-admin-comment.service.ts'
  ),

  read('apps', 'api', 'src', 'routes', 'pharmacy-owner.routes.ts'),

  read(
    'apps',
    'admin',
    'src',
    'lib',
    'api',
    'browser',
    'admin-pharmacy-owners.api.ts'
  ),

  read(
    'apps',
    'admin',
    'src',
    'lib',
    'pharmacy-owners',
    'admin-pharmacy-owner.ts'
  ),

  read('apps', 'api', 'src', 'schemas', 'admin-pharmacy-owner.schema.ts'),
  read('apps', 'admin', 'src', 'lib', 'layout', 'navigation.ts'),

  read(
    'apps',
    'admin',
    'src',
    'components',
    'layout',
    'AdminSidebar',
    'AdminSidebar.tsx'
  ),

  read(
    'apps',
    'admin',
    'src',
    'components',
    'layout',
    'AdminMobileMenu',
    'AdminMobileMenu.tsx'
  ),

  read(
    'apps',
    'admin',
    'src',
    'providers',
    'AdminPharmacyOwnerNavigationBadgeProvider',
    'AdminPharmacyOwnerNavigationBadgeProvider.tsx'
  ),

  read(
    'apps',
    'admin',
    'src',
    'components',
    'pharmacy-owners',
    'PharmacyOwnersPageContent',
    'PharmacyOwnersPageContent.tsx'
  ),

  read(
    'apps',
    'admin',
    'src',
    'components',
    'pharmacy-owners',
    'PharmacyOwnerDetailsPageContent',
    'LinkedPharmaciesTab.tsx'
  ),
]);

//===================================================================
// Navigation badge is permission-gated, lightweight, shared by desktop/mobile,
// and an unavailable summary is not presented as a legitimate zero count.

assert.match(
  navigation,
  /label:\s*'Pharmacy Owners'[\s\S]*?requiredPermission:\s*ADMIN_PERMISSIONS\.pharmacyOwners\.view/
);

assert.match(badgeProvider, /ADMIN_PERMISSIONS\.pharmacyOwners\.view/);
assert.match(badgeProvider, /canAdmin\(\s*access,/);
assert.match(badgeProvider, /getAdminPharmacyOwnerSummary/);
assert.match(badgeProvider, /newOwnerCount:\s*summary\.new/);
assert.match(badgeProvider, /catch\(\(\) =>[\s\S]*?newOwnerCount:\s*null/);
assert.doesNotMatch(badgeProvider, /catch\([\s\S]{0,500}?newOwnerCount:\s*0/);
assert.match(sidebar, /useAdminPharmacyOwnerNavigationBadge/);
assert.match(sidebar, /item\.href === ADMIN_ROUTES\.PHARMACY_OWNERS/);
assert.match(mobileMenu, /useAdminPharmacyOwnerNavigationBadge/);
assert.match(mobileMenu, /item\.href === ADMIN_ROUTES\.PHARMACY_OWNERS/);

//===================================================================
// Stage 13 has no Admin owner-creation endpoint and no Admin document mutation.

assert.doesNotMatch(
  apiRoutes,
  /adminRoutes\.post\(\s*['"]\/pharmacy-owners['"]/
);

assert.doesNotMatch(
  ownerDocumentRoutes,
  /adminRoutes\.(?:post|put|patch|delete)\(\s*['"]\/pharmacy-owners\/:ownerId\/documents/
);

assert.doesNotMatch(
  browserApi,
  /(?:create|upload|update|delete)AdminPharmacyOwnerDocument/
);

//===================================================================
// Admin comments stay in the Admin domain; owner routes expose documents only.

assert.match(apiRoutes, /\/pharmacy-owners\/:ownerId\/comments/);
assert.doesNotMatch(ownerRoutes, /comment/i);
assert.match(ownerCommentService, /createdByAdminUserId/);

//===================================================================
// Owner list/detail reads aggregate in Mongo and do not regress to per-owner or
// per-pharmacy application loops / findOne owner assumptions.

assert.match(
  ownerReadService,
  /listAdminPharmacyOwnersService[\s\S]*?User\.aggregate<OwnerListAggregateResult>/
);

assert.match(
  ownerReadService,
  /listAdminPharmacyOwnerPharmaciesService[\s\S]*?Pharmacy\.aggregate<OwnerPharmaciesAggregateResult>/
);

assert.doesNotMatch(
  ownerReadService,
  /(?:Pharmacy|User)\.findOne\(\{[\s\S]{0,160}?ownerId/
);

assert.doesNotMatch(
  ownerReadService,
  /(?:for\s*\([^)]*owner|owners\.map\()[\s\S]{0,350}?(?:Pharmacy|Order|Client)\.(?:find|findOne|countDocuments)/
);

//===================================================================
// Runtime and backend boundaries reject malformed entity identifiers before
// requests reach unrestricted Mongo lookups.

assert.match(ownerSchema, /ownerId:\s*mongoIdSchema/);
assert.match(ownerParser, /assertAdminPharmacyOwnerEntityId/);
assert.match(ownerParser, /isValidObjectId\(value\)/);
assert.match(browserApi, /ownerId\(rawOwnerId\)/);
assert.match(browserApi, /nestedId\(rawDocumentId, 'document id'\)/);

//===================================================================
// Filter transitions are keyed to full URL state, stale requests are aborted,
// and backend errors never become empty/zero results.

for (const source of [ownersPage, linkedPharmaciesTab]) {
  assert.match(source, /function getStateKey\(/);
  assert.match(source, /new AbortController\(\)/);
  assert.match(source, /controller\.signal\.aborted/);
  assert.match(source, /requestKey/);
  assert.match(source, /data:\s*null,\s*error:/);
}

assert.match(ownersPage, /statistics[\s\S]*?data:\s*null,\s*error:/);

assert.doesNotMatch(
  ownersPage,
  /catch\([\s\S]{0,600}?statistics[\s\S]{0,300}?\{\s*all:\s*0,\s*new:\s*0,\s*active:\s*0,\s*blocked:\s*0/
);

//===================================================================
// Owner document audit snapshots include metadata only, never binary payloads.

const auditSnapshotStart = ownerDocumentService.indexOf(
  'function auditSnapshot'
);

const auditSnapshotEnd = ownerDocumentService.indexOf(
  '//===============================================================',
  auditSnapshotStart + 1
);

const ownerDocumentAuditSnapshot = ownerDocumentService.slice(
  auditSnapshotStart,
  auditSnapshotEnd
);

assert.match(ownerDocumentAuditSnapshot, /name:/);
assert.match(ownerDocumentAuditSnapshot, /size:/);
assert.match(ownerDocumentAuditSnapshot, /type:/);

assert.doesNotMatch(
  ownerDocumentAuditSnapshot,
  /content|dataUrl|base64|sha256|binary|pictureUrl/i
);

console.log('Admin Pharmacy Owners hardening checks passed.');
