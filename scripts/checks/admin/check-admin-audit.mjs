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
  ['apps', 'api', 'src', 'controllers', 'admin-audit.controller.ts'],
  ['apps', 'admin', 'src', 'lib', 'audit', 'admin-audit.ts'],
  ['apps', 'admin', 'src', 'lib', 'api', 'browser', 'admin-audit.api.ts'],
  ['apps', 'admin', 'src', 'components', 'activity', 'ActivityHistory.tsx'],
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
    `Stage 9 file must exist: ${file.join('/')}`
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

const model = await read(
  'apps',
  'api',
  'src',
  'models',
  'adminAuditLog.model.ts'
);

const routes = await read('apps', 'api', 'src', 'routes', 'admin.routes.ts');

const auditService = await read(
  'apps',
  'api',
  'src',
  'services',
  'admin-audit.service.ts'
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

assert.match(
  model,
  /timestamps:\s*\{\s*createdAt:\s*true,\s*updatedAt:\s*false\s*\}/
);

assert.doesNotMatch(model, /expires|expireAfterSeconds/i);

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
assert.match(auditService, /AdminAuditLog\.create/);
assert.match(auditService, /actorNameSnapshot/);
assert.match(auditService, /requestId/);

assert.match(pharmacyService, /appendAdminAuditLog/);
assert.match(productRequestService, /appendAdminAuditLog/);
assert.match(ownerService, /appendAdminAuditLog/);
assert.match(pharmacyService, /session\.withTransaction/);
assert.match(productRequestService, /session\.withTransaction/);
assert.match(ownerService, /session\.withTransaction/);

assert.match(navigation, /Activity history/);
assert.match(navigation, /ADMIN_PERMISSIONS\.audit\.view/);
assert.match(activityPage, /AdminPermissionGate/);
assert.match(activityPage, /ADMIN_PERMISSIONS\.audit\.view/);

assert.match(browserApi, /ADMIN_API_ROUTES\.audit/);
assert.doesNotMatch(browserApi, /https?:\/\//);
assert.match(bffList, /createPrivateProxyRoute/);
assert.match(apiClientRoutes, /\/admin\/audit/);

console.log('Admin audit structural checks passed.');
