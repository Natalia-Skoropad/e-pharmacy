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
  roleTypes,
  sharedUserStatuses,
  apiAuthConstants,
  adminOwnerParser,
  clientSchema,
  lifecycleService,
  lifecycleConstants,
  authService,
  ownerRoutes,
  adminRoutes,
  ownerDocumentService,
  lifecycleIntegration,
  documentIntegration,
  commentIntegration,
  activityIntegration,
  rootPackage,
  apiPackage,
] = await Promise.all([
  read('packages', 'types', 'src', 'auth', 'role.ts'),
  read('packages', 'config', 'src', 'users', 'domain-values.ts'),
  read('apps', 'api', 'src', 'constants', 'auth.ts'),

  read(
    'apps',
    'admin',
    'src',
    'lib',
    'pharmacy-owners',
    'admin-pharmacy-owner.ts'
  ),

  read('apps', 'api', 'src', 'schemas', 'client.schema.ts'),
  read('apps', 'api', 'src', 'services', 'pharmacy-owner-lifecycle.service.ts'),
  read('apps', 'api', 'src', 'constants', 'pharmacy-owner-lifecycle.ts'),
  read('apps', 'api', 'src', 'services', 'auth.service.ts'),
  read('apps', 'api', 'src', 'routes', 'pharmacy-owner.routes.ts'),
  read('apps', 'api', 'src', 'routes', 'admin.routes.ts'),
  read('apps', 'api', 'src', 'services', 'pharmacy-owner-document.service.ts'),

  read(
    'apps',
    'api',
    'src',
    'services',
    'pharmacy-owner-lifecycle.mongo.integration.test.ts'
  ),

  read(
    'apps',
    'api',
    'src',
    'services',
    'pharmacy-owner-document.mongo.integration.test.ts'
  ),

  read(
    'apps',
    'api',
    'src',
    'services',
    'pharmacy-owner-admin-comment.mongo.integration.test.ts'
  ),

  read(
    'apps',
    'api',
    'src',
    'services',
    'admin-audit-owner-scope.mongo.integration.test.ts'
  ),

  read('package.json'),
  read('apps', 'api', 'package.json'),
]);

//===================================================================
// Owner account status is canonical and role-aware. Client/Admin account
// filters remain active|blocked; only pharmacy owners gain `new`.

assert.match(
  roleTypes,
  /export type PharmacyOwnerAccountStatus = 'new' \| 'active' \| 'blocked'/
);

assert.match(
  sharedUserStatuses,
  /CLIENT_ACCOUNT_STATUSES\s*=\s*\[\s*'active',\s*'blocked'/
);

assert.match(
  sharedUserStatuses,
  /ADMIN_ACCOUNT_STATUSES\s*=\s*\[\s*'active',\s*'blocked'/
);

assert.match(
  sharedUserStatuses,
  /PHARMACY_OWNER_ACCOUNT_STATUSES\s*=\s*\[\s*'new',\s*'active',\s*'blocked'/
);

assert.match(
  apiAuthConstants,
  /PHARMACY_OWNER_ACCOUNT_STATUSES\s*=\s*\[\s*USER_STATUSES\.NEW,\s*USER_STATUSES\.ACTIVE,\s*USER_STATUSES\.BLOCKED/
);

assert.match(
  adminOwnerParser,
  /PHARMACY_OWNER_ACCOUNT_STATUSES[\s\S]*?ADMIN_PHARMACY_OWNER_STATUSES\s*=\s*\n?\s*PHARMACY_OWNER_ACCOUNT_STATUSES/
);

assert.doesNotMatch(
  adminOwnerParser,
  /ADMIN_PHARMACY_OWNER_STATUSES\s*=\s*\[\s*'new'/
);

assert.match(
  clientSchema,
  /clientsQuerySchema[\s\S]*?status:\s*z\.enum\(\['active', 'blocked'\]\)\.optional\(\)/
);

//===================================================================
// Lifecycle matrix, active-order guard, session revoke and cascade remain in
// one transaction; reactivation deliberately leaves pharmacies blocked.

assert.match(lifecycleService, /session\.withTransaction/);

assert.match(
  lifecycleService,
  /currentStatus === USER_STATUSES\.NEW[\s\S]*?currentStatus === USER_STATUSES\.ACTIVE/
);

assert.match(
  lifecycleService,
  /nextStatus === USER_STATUSES\.ACTIVE[\s\S]*?currentStatus === USER_STATUSES\.BLOCKED/
);

assert.match(
  lifecycleConstants,
  /PHARMACY_OWNER_ACTIVE_ORDER_STATUSES\s*=\s*\[\s*'new',\s*'in_progress'/
);

assert.match(lifecycleService, /Order\.countDocuments\(/);
assert.match(lifecycleService, /revokeAllUserSessionsService/);
assert.match(lifecycleService, /Pharmacy\.updateMany\(/);

assert.match(
  lifecycleService,
  /Reactivating an owner deliberately does not touch linked pharmacy[\s\S]*?owner\.status = USER_STATUSES\.ACTIVE/
);

//===================================================================
// New owners may authenticate in the pharmacy app; blocked owners remain
// rejected by the canonical auth lifecycle.

const loginStart = authService.indexOf(
  'export async function loginUserService'
);

const loginEnd = authService.indexOf(
  'export async function refreshAuthSessionService',
  loginStart
);

const loginService = authService.slice(loginStart, loginEnd);

assert.match(loginService, /user\.status === USER_STATUSES\.BLOCKED/);
assert.match(loginService, /AUTH_ERROR_CODES\.USER_BLOCKED/);

assert.doesNotMatch(
  loginService,
  /user\.status\s*(?:!==|===)\s*USER_STATUSES\.ACTIVE/
);

//===================================================================
// Owner routes have no access to Admin comments. Admin document endpoints are
// read-only while owner document mutations stay scoped to /me.

assert.doesNotMatch(ownerRoutes, /comment/i);
assert.match(ownerRoutes, /post\(\s*'\/me\/documents'/);
assert.match(ownerRoutes, /delete\(\s*'\/me\/documents\/:documentId'/);
assert.match(adminRoutes, /get\(\s*'\/pharmacy-owners\/:ownerId\/comments'/);
assert.match(adminRoutes, /post\(\s*'\/pharmacy-owners\/:ownerId\/comments'/);

assert.doesNotMatch(
  adminRoutes,
  /(?:post|put|patch|delete)\(\s*'\/pharmacy-owners\/:ownerId\/documents/
);

//===================================================================
// Binary document/photo content must not leak into Audit snapshots.

const documentSnapshotStart = ownerDocumentService.indexOf(
  'function auditSnapshot'
);

const documentSnapshotEnd = ownerDocumentService.indexOf(
  '//===============================================================',
  documentSnapshotStart + 1
);

const documentSnapshot = ownerDocumentService.slice(
  documentSnapshotStart,
  documentSnapshotEnd
);

assert.doesNotMatch(documentSnapshot, /content|dataUrl|base64|sha256|binary/i);

assert.match(
  authService,
  /PHARMACY_OWNER_PHOTO_UPDATED[\s\S]*?before:\s*\{ profilePhotoChanged: false \}[\s\S]*?after:\s*\{ profilePhotoChanged: true \}/
);

//===================================================================
// Stage 13.12 Mongo regressions are explicit and run from the repository's
// integration command instead of being hidden inside the ordinary API suite.

const rootScripts = JSON.parse(rootPackage).scripts;
const apiScripts = JSON.parse(apiPackage).scripts;

assert.match(
  rootScripts['test:integration'],
  /@e-pharmacy\/client test:integration[\s\S]*?@e-pharmacy\/api test:integration/
);

assert.match(apiScripts.test, /--exclude=\.integration\.test\.ts/);
assert.match(apiScripts['test:integration'], /--match=\.integration\.test\.ts/);

assert.match(
  lifecycleIntegration,
  /first pharmacy activation activates a new owner once/
);

assert.match(lifecycleIntegration, /new pharmacy owner can authenticate/);
assert.match(lifecycleIntegration, /owner with active order cannot be blocked/);
assert.match(lifecycleIntegration, /blockedPharmacies, 2/);

assert.match(
  lifecycleIntegration,
  /status: 'active', reason: 'Compliance review completed.'/
);

assert.match(lifecycleIntegration, /\['blocked', 'blocked'\]/);

assert.match(
  documentIntegration,
  /owner documents remain isolated by ownerUserId/
);

assert.match(documentIntegration, /String\(ownerB\._id\)/);
assert.match(documentIntegration, /Owner document was not found/);

assert.match(commentIntegration, /owner-scoped/);
assert.match(commentIntegration, /ownerBComments/);
assert.match(commentIntegration, /assert\.deepEqual\(ownerBComments, \[\]\)/);

assert.match(
  activityIntegration,
  /scopeEntityType: ADMIN_AUDIT_ENTITY_TYPES\.PHARMACY_OWNER/
);

assert.match(activityIntegration, /scopeEntityId: String\(owner\._id\)/);

console.log('Pharmacy owner lifecycle hardening checks passed.');
