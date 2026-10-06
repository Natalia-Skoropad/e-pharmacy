import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
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

const exists = async (...segments) => {
  try {
    await access(path.join(ROOT_DIR, ...segments));
    return true;
  } catch {
    return false;
  }
};

//===================================================================

const requiredFiles = [
  ['apps', 'api', 'src', 'constants', 'admin-audit.ts'],
  ['apps', 'api', 'src', 'models', 'adminAuditLog.model.ts'],
  ['apps', 'api', 'src', 'schemas', 'admin-audit.schema.ts'],
  ['apps', 'api', 'src', 'services', 'admin-audit.service.ts'],
  [
    'apps',
    'api',
    'src',
    'services',
    'pharmacy-owner-registration-audit-migration.service.ts',
  ],
  ['apps', 'api', 'src', 'controllers', 'admin-audit.controller.ts'],
  ['apps', 'api', 'src', 'services', 'admin-employee-profile.service.ts'],
  ['apps', 'api', 'src', 'services', 'admin-employee-document.service.ts'],
  ['apps', 'api', 'src', 'services', 'admin-employee-note.service.ts'],
  ['apps', 'api', 'src', 'services', 'admin-settings.service.ts'],
  ['apps', 'admin', 'src', 'lib', 'audit', 'admin-audit.ts'],
  ['apps', 'admin', 'src', 'lib', 'api', 'browser', 'admin-audit.api.ts'],
  ['apps', 'admin', 'src', 'components', 'activity', 'ActivityHistory.tsx'],
  [
    'apps',
    'admin',
    'src',
    'components',
    'activity',
    'ActivityActorIdentity.tsx',
  ],
  ['apps', 'admin', 'src', 'components', 'activity', 'AuditDetailsModal.tsx'],
  [
    'apps',
    'admin',
    'src',
    'app',
    'admin',
    'pharmacy-owners',
    '[ownerId]',
    'page.tsx',
  ],
  ['apps', 'admin', 'src', 'app', 'admin', 'settings', 'activity', 'page.tsx'],
  ['apps', 'admin', 'src', 'app', 'api', 'admin', 'audit', 'route.ts'],
  [
    'apps',
    'admin',
    'src',
    'app',
    'api',
    'admin',
    'audit',
    '[auditLogId]',
    'route.ts',
  ],
];

for (const file of requiredFiles) {
  assert.equal(
    await exists(...file),
    true,
    `Audit file must exist: ${file.join('/')}`
  );
}

//===================================================================

const permissions = await read(
  'apps',
  'api',
  'src',
  'constants',
  'admin-permissions.ts'
);

const auditConstants = await read(
  'apps',
  'api',
  'src',
  'constants',
  'admin-audit.ts'
);

const model = await read(
  'apps',
  'api',
  'src',
  'models',
  'adminAuditLog.model.ts'
);

const auditSchema = await read(
  'apps',
  'api',
  'src',
  'schemas',
  'admin-audit.schema.ts'
);

const routes = await read('apps', 'api', 'src', 'routes', 'admin.routes.ts');

const auditService = await read(
  'apps',
  'api',
  'src',
  'services',
  'admin-audit.service.ts'
);

const ownerRegistrationAuditMigration = await read(
  'apps',
  'api',
  'src',
  'services',
  'pharmacy-owner-registration-audit-migration.service.ts'
);

const pharmacyService = await read(
  'apps',
  'api',
  'src',
  'services',
  'admin.service.ts'
);

const productRequestService = await read(
  'apps',
  'api',
  'src',
  'services',
  'product-request.service.ts'
);

const ownerService = await read(
  'apps',
  'api',
  'src',
  'services',
  'admin-owner.service.ts'
);

const ownerLifecycleService = await read(
  'apps',
  'api',
  'src',
  'services',
  'pharmacy-owner-lifecycle.service.ts'
);

const authService = await read(
  'apps',
  'api',
  'src',
  'services',
  'auth.service.ts'
);

const authController = await read(
  'apps',
  'api',
  'src',
  'controllers',
  'auth.controller.ts'
);

const profileService = await read(
  'apps',
  'api',
  'src',
  'services',
  'admin-employee-profile.service.ts'
);

const adminDocumentService = await read(
  'apps',
  'api',
  'src',
  'services',
  'admin-employee-document.service.ts'
);

const privateNoteService = await read(
  'apps',
  'api',
  'src',
  'services',
  'admin-employee-note.service.ts'
);

const adminSettingsService = await read(
  'apps',
  'api',
  'src',
  'services',
  'admin-settings.service.ts'
);

const navigation = await read(
  'apps',
  'admin',
  'src',
  'lib',
  'layout',
  'navigation.ts'
);

const activityPage = await read(
  'apps',
  'admin',
  'src',
  'app',
  'admin',
  'settings',
  'activity',
  'page.tsx'
);

const browserApi = await read(
  'apps',
  'admin',
  'src',
  'lib',
  'api',
  'browser',
  'admin-audit.api.ts'
);

const adminAuditParser = await read(
  'apps',
  'admin',
  'src',
  'lib',
  'audit',
  'admin-audit.ts'
);

const activityHistory = await read(
  'apps',
  'admin',
  'src',
  'components',
  'activity',
  'ActivityHistory.tsx'
);

const activityActorIdentity = await read(
  'apps',
  'admin',
  'src',
  'components',
  'activity',
  'ActivityActorIdentity.tsx'
);

const auditDetailsModal = await read(
  'apps',
  'admin',
  'src',
  'components',
  'activity',
  'AuditDetailsModal.tsx'
);

const auditPresentation = await read(
  'apps',
  'admin',
  'src',
  'lib',
  'audit',
  'admin-audit-presentation.ts'
);

const pharmacyOwnerDetailsPage = await read(
  'apps',
  'admin',
  'src',
  'app',
  'admin',
  'pharmacy-owners',
  '[ownerId]',
  'page.tsx'
);

const activityFilters = await read(
  'apps',
  'admin',
  'src',
  'components',
  'activity',
  'ActivityFiltersDrawer.tsx'
);

const bffList = await read(
  'apps',
  'admin',
  'src',
  'app',
  'api',
  'admin',
  'audit',
  'route.ts'
);

const apiClientRoutes = await read(
  'packages',
  'api-client',
  'src',
  'contracts',
  'backend-resource-routes.ts'
);

//===================================================================

assert.match(permissions, /audit:\s*\['view'\]/);

assert.match(auditConstants, /ADMIN_AUDIT_SECTIONS/);
assert.match(model, /section:\s*\{/);
assert.match(auditService, /section,/);
assert.match(pharmacyService, /ADMIN_AUDIT_SECTIONS\.PHARMACIES/);
assert.match(productRequestService, /ADMIN_AUDIT_SECTIONS\.PRODUCT_REQUESTS/);
assert.match(ownerService, /ADMIN_AUDIT_SECTIONS\.EMPLOYEES/);
assert.match(profileService, /ADMIN_AUDIT_SECTIONS\.PROFILE/);
assert.match(adminDocumentService, /ADMIN_AUDIT_SECTIONS\.PROFILE/);

assert.match(
  auditConstants,
  /ADMIN_EMPLOYEE_PROFILE_UPDATED:\s*'adminEmployee\.profile\.updated'/
);

for (const [key, action] of [
  ['ADMIN_EMPLOYEE_DOCUMENT_UPLOADED', 'adminEmployee.document.uploaded'],
  ['ADMIN_EMPLOYEE_DOCUMENT_REPLACED', 'adminEmployee.document.replaced'],
  ['ADMIN_EMPLOYEE_DOCUMENT_DELETED', 'adminEmployee.document.deleted'],
]) {
  assert.match(
    auditConstants,
    new RegExp(`${key}:\\s*'${action.replaceAll('.', '\\.')}'`)
  );
  assert.match(adminAuditParser, new RegExp(action.replaceAll('.', '\\.')));
}

assert.match(auditConstants, /ADMIN_EMPLOYEE:\s*'adminEmployee'/);
assert.match(adminAuditParser, /'adminEmployee\.profile\.updated'/);
assert.match(adminAuditParser, /'adminEmployee'/);

assert.match(
  model,
  /timestamps:\s*\{\s*createdAt:\s*true,\s*updatedAt:\s*false\s*\}/
);

assert.match(
  auditConstants,
  /ADMIN_AUDIT_RETENTION_SECONDS\s*=\s*60\s*\*\s*60\s*\*\s*24\s*\*\s*365\s*\*\s*3/
);

assert.match(
  model,
  /createdAt:\s*1[\s\S]*?expireAfterSeconds:\s*ADMIN_AUDIT_RETENTION_SECONDS[\s\S]*?name:\s*'admin_audit_retention_ttl'/
);

assert.match(
  routes,
  /get\(\s*['"]\/audit['"][\s\S]*?requireAdminPermission\(ADMIN_PERMISSIONS\.audit\.view\)/
);

assert.match(
  routes,
  /get\(\s*['"]\/audit\/:auditLogId['"][\s\S]*?requireAdminPermission\(ADMIN_PERMISSIONS\.audit\.view\)/
);

assert.doesNotMatch(routes, /\.(?:post|patch|put|delete)\(\s*['"]\/audit/);
assert.doesNotMatch(routes, /post\(\s*['"]\/pharmacies['"]/);

assert.match(auditService, /SENSITIVE_AUDIT_KEY_PATTERN/);
assert.match(auditService, /picture\|pictureurl/);
assert.match(auditService, /AdminAuditLog\.create/);
assert.match(auditService, /actorNameSnapshot/);
assert.match(auditService, /requestId/);

assert.match(pharmacyService, /appendAdminAuditLog/);
assert.match(productRequestService, /appendAdminAuditLog/);
assert.match(ownerService, /appendAdminAuditLog/);
assert.match(profileService, /appendAdminAuditLog/);
assert.match(adminDocumentService, /appendAdminAuditLog/);
assert.doesNotMatch(privateNoteService, /appendAdminAuditLog|AdminAuditLog/);

assert.match(adminSettingsService, /appendAdminAuditLog/);

assert.equal(
  (adminSettingsService.match(/session\.withTransaction/g) ?? []).length,
  6
);

for (const [key, action] of [
  ['PRODUCT_CATEGORY_CREATED', 'productCategory.created'],
  ['PRODUCT_CATEGORY_UPDATED', 'productCategory.updated'],
  ['PRODUCT_CATEGORY_DELETED', 'productCategory.deleted'],
  ['POSITION_CREATED', 'position.created'],
  ['POSITION_UPDATED', 'position.updated'],
  ['POSITION_DELETED', 'position.deleted'],
]) {
  assert.match(
    auditConstants,
    new RegExp(`${key}:\\s*'${action.replaceAll('.', '\\.')}'`)
  );
  assert.match(adminAuditParser, new RegExp(action.replaceAll('.', '\\.')));
}

assert.match(auditConstants, /PRODUCT_CATEGORY:\s*'productCategory'/);
assert.match(auditConstants, /POSITION:\s*'position'/);
assert.match(adminAuditParser, /'productCategory'/);
assert.match(adminAuditParser, /'position'/);

for (const [key, action] of [
  ['PHARMACY_OWNER_ACCOUNT_CREATED', 'pharmacyOwner.account.created'],
  [
    'PHARMACY_REGISTRATION_DOCUMENTS_ATTACHED',
    'pharmacy.registrationDocuments.attached',
  ],
  ['PHARMACY_OWNER_PROFILE_UPDATED', 'pharmacyOwner.profile.updated'],
  ['PHARMACY_OWNER_PHOTO_UPDATED', 'pharmacyOwner.photo.updated'],
  ['PHARMACY_OWNER_STATUS_CHANGED', 'pharmacyOwner.status.changed'],
  ['PHARMACY_OWNER_DOCUMENT_UPLOADED', 'pharmacyOwner.document.uploaded'],
  ['PHARMACY_OWNER_DOCUMENT_DELETED', 'pharmacyOwner.document.deleted'],
  ['PHARMACY_OWNER_COMMENT_CREATED', 'pharmacyOwner.comment.created'],
  ['PHARMACY_OWNER_COMMENT_DELETED', 'pharmacyOwner.comment.deleted'],
]) {
  assert.match(
    auditConstants,
    new RegExp(`${key}:\\s*'${action.replaceAll('.', '\\.')}'`)
  );

  assert.match(adminAuditParser, new RegExp(action.replaceAll('.', '\\.')));
}

assert.match(auditConstants, /PHARMACY_OWNER:\s*'pharmacyOwner'/);

assert.match(
  auditConstants,
  /PHARMACY_OWNER_DOCUMENT:\s*'pharmacyOwnerDocument'/
);

assert.match(
  auditConstants,
  /PHARMACY_OWNER_COMMENT:\s*'pharmacyOwnerComment'/
);

assert.match(auditConstants, /EMPLOYEE:\s*'employee'/);
assert.match(auditConstants, /PHARMACY_OWNER:\s*'pharmacyOwner'/);
assert.match(auditConstants, /PHARMACY_EMPLOYEE:\s*'pharmacyEmployee'/);

assert.match(model, /scopeEntityType:\s*\{/);
assert.match(model, /scopeEntityId:\s*\{/);

assert.match(
  model,
  /scopeEntityType:\s*1,[\s\S]*?scopeEntityId:\s*1,[\s\S]*?createdAt:\s*-1/
);

assert.match(auditSchema, /actorType:\s*auditActorTypeSchema\.optional\(\)/);

assert.match(
  auditSchema,
  /scopeEntityType:\s*auditEntityTypeSchema\.optional\(\)/
);

assert.match(auditSchema, /scopeEntityId:[\s\S]*?\.optional\(\)/);

assert.match(
  auditSchema,
  /scopeEntityType and scopeEntityId must be provided together/
);

assert.match(auditService, /Pharmacy\.distinct\(['"]ownerId['"]\)/);
assert.match(auditService, /AdminAuditLog\.aggregate/);
assert.match(auditService, /\$group:\s*\{ _id:\s*['"]\$actorUserId['"] \}/);
assert.match(auditService, /from:\s*User\.collection\.name/);
assert.match(auditService, /from:\s*Pharmacy\.collection\.name/);
assert.match(auditService, /foreignField:\s*'managerUserIds'/);
assert.match(auditService, /ADMIN_AUDIT_ACTOR_TYPES\.PHARMACY_OWNER/);
assert.match(auditService, /ADMIN_AUDIT_ACTOR_TYPES\.PHARMACY_EMPLOYEE/);
assert.match(auditService, /filter\.scopeEntityType = query\.scopeEntityType/);
assert.match(auditService, /filter\.scopeEntityId = query\.scopeEntityId/);
assert.match(auditService, /query\.actorType/);

assert.match(
  pharmacyService,
  /scopeEntityType:\s*ADMIN_AUDIT_ENTITY_TYPES\.PHARMACY_OWNER/
);

assert.match(pharmacyService, /scopeEntityId:\s*String\(updated\.ownerId\)/);

assert.match(
  ownerLifecycleService,
  /scopeEntityType:\s*ADMIN_AUDIT_ENTITY_TYPES\.PHARMACY_OWNER/
);

assert.match(ownerLifecycleService, /scopeEntityId:/);

assert.match(
  authController,
  /updateUserProfileService\([\s\S]*?res\.locals\.requestId[\s\S]*?\)/
);

assert.match(
  authController,
  /registerUserService\([\s\S]*?res\.locals\.requestId[\s\S]*?\)/
);

const ownerProfileAudit = authService.match(
  /async function updatePharmacyOwnerUserProfileWithAudit[\s\S]*?(?=\/\/={10,}\n\nexport async function updateUserProfileService)/
)?.[0];

assert.ok(ownerProfileAudit);
assert.match(ownerProfileAudit, /PHARMACY_OWNER_PROFILE_UPDATED/);
assert.match(ownerProfileAudit, /PHARMACY_OWNER_PHOTO_UPDATED/);

assert.match(
  ownerProfileAudit,
  /scopeEntityType:\s*ADMIN_AUDIT_ENTITY_TYPES\.PHARMACY_OWNER/
);

assert.match(ownerProfileAudit, /scopeEntityId:\s*userId/);
assert.match(ownerProfileAudit, /profilePhotoChanged/);

assert.doesNotMatch(
  ownerProfileAudit,
  /before:\s*\{[^}]*pictureUrl|after:\s*\{[^}]*pictureUrl/
);

assert.match(auditService, /photo\|photourl\|image\|imageurl\|base64\|dataurl/);

const registrationAudit = authService.match(
  /export async function registerUserService[\s\S]*?(?=\/\/={10,}\n\nexport async function loginUserService)/
)?.[0];

assert.ok(registrationAudit);
assert.match(registrationAudit, /PHARMACY_OWNER_ACCOUNT_CREATED/);
assert.match(registrationAudit, /PHARMACY_REGISTRATION_DOCUMENTS_ATTACHED/);
assert.doesNotMatch(registrationAudit, /PHARMACY_OWNER_DOCUMENT_UPLOADED/);

assert.match(
  registrationAudit,
  /scopeEntityType:\s*ADMIN_AUDIT_ENTITY_TYPES\.PHARMACY_OWNER/
);

assert.doesNotMatch(
  registrationAudit,
  /after:\s*\{[^}]*sha256|after:\s*\{[^}]*base64|after:\s*\{[^}]*content/
);

assert.match(ownerRegistrationAuditMigration, /AdminAuditLog\.exists/);
assert.match(ownerRegistrationAuditMigration, /\$setOnInsert/);
assert.match(ownerRegistrationAuditMigration, /upsert:\s*true/);
assert.match(ownerRegistrationAuditMigration, /timestamps:\s*false/);

assert.match(
  ownerRegistrationAuditMigration,
  /createdAt:\s*getHistoricalCreatedAt\(owner\.createdAt/
);

assert.doesNotMatch(
  ownerRegistrationAuditMigration,
  /document\.sha256|document\.content|dataUrl|base64/i
);

assert.match(activityHistory, /label="Search by employee"/);
assert.match(activityHistory, /label="Search by pharmacy owner"/);

assert.match(
  activityHistory,
  /createOwnerOptions[\s\S]*?actor\.id[\s\S]*?actor\.email[\s\S]*?actor\.phone/
);

assert.match(activityHistory, /title:\s*'Changed by'/);
assert.match(activityHistory, /<ActivityActorIdentity/);
assert.doesNotMatch(activityHistory, /Reason:\s*\{item\.reason\}/);
assert.match(activityActorIdentity, /getAdminAuditActorHref/);

assert.match(
  activityActorIdentity,
  /<TextActionButton[\s\S]*?className=\{css\.actorIdentityNameLink\}[\s\S]*?href=\{href\}/
);

assert.match(activityActorIdentity, /className=\{css\.actorIdentityPhoto\}/);
assert.match(auditDetailsModal, /statusPlacement="inline"/);
assert.match(activityActorIdentity, /<TableImagePreview/);
assert.match(auditDetailsModal, /<ActivityActorIdentity[\s\S]*?showPhoto/);

assert.match(
  auditPresentation,
  /actor\.actorType === 'employee'[\s\S]*?SETTINGS_EMPLOYEES/
);

assert.match(
  auditPresentation,
  /actor\.actorType === 'pharmacyOwner'[\s\S]*?PHARMACY_OWNERS/
);

assert.match(pharmacyOwnerDetailsPage, /ActivityPharmacyOwnerDetails/);
assert.match(activityFilters, /label="Changed by"/);
assert.match(activityFilters, /pharmacyOwner:\s*'Pharmacy owner'/);
assert.match(activityFilters, /pharmacyEmployee:\s*'Pharmacy employee'/);
assert.match(adminAuditParser, /scopeEntityType/);
assert.match(adminAuditParser, /scopeEntityId/);
assert.match(adminAuditParser, /actorType/);

assert.match(pharmacyService, /session\.withTransaction/);
assert.match(productRequestService, /session\.withTransaction/);
assert.match(ownerService, /session\.withTransaction/);
assert.match(profileService, /session\.withTransaction/);

assert.equal(
  (adminDocumentService.match(/session\.withTransaction/g) ?? []).length,
  3
);

assert.match(profileService, /ADMIN_EMPLOYEE_PROFILE_UPDATED/);
assert.match(profileService, /ADMIN_AUDIT_ENTITY_TYPES\.ADMIN_EMPLOYEE/);
assert.match(profileService, /hasPicture = Boolean\(user\.pictureUrl\)/);

assert.doesNotMatch(
  profileService,
  /before:\s*\{[^}]*pictureUrl|after:\s*\{[^}]*pictureUrl/
);

assert.doesNotMatch(profileService, /password|currentPassword|newPassword/i);

assert.match(
  adminDocumentService,
  /ADMIN_EMPLOYEE_DOCUMENT_(?:UPLOADED|REPLACED|DELETED)/
);

const adminDocumentAuditSnapshot = adminDocumentService.match(
  /function auditSnapshot[\s\S]*?(?=\/\/={10,})/
)?.[0];

assert.ok(adminDocumentAuditSnapshot);
assert.doesNotMatch(adminDocumentAuditSnapshot, /content|dataUrl|sha256/i);

assert.match(navigation, /Activity history/);
assert.match(navigation, /ADMIN_PERMISSIONS\.audit\.view/);
assert.match(activityPage, /AdminPermissionGate/);
assert.match(activityPage, /ADMIN_PERMISSIONS\.audit\.view/);

assert.match(browserApi, /ADMIN_API_ROUTES\.audit/);
assert.doesNotMatch(browserApi, /https?:\/\//);
assert.match(bffList, /createPrivateProxyRoute/);
assert.match(apiClientRoutes, /\/admin\/audit/);

console.log('Admin audit structural checks passed.');
