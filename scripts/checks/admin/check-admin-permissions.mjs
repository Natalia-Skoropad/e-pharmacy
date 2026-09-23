import assert from 'node:assert/strict';
import { access, readFile, readdir } from 'node:fs/promises';
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

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await collectFiles(entryPath)));
    else files.push(entryPath);
  }

  return files;
}

//===================================================================

function extractPermissionCalls(source) {
  return [
    ...source.matchAll(/permission\(['"]([^'"]+)['"],\s*['"]([^'"]+)['"]\)/g),
  ]
    .map((match) => `${match[1]}.${match[2]}`)
    .sort();
}

//===================================================================

const requiredFiles = [
  ['apps', 'api', 'src', 'constants', 'admin-permissions.ts'],
  ['apps', 'api', 'src', 'constants', 'admin-access.ts'],
  ['apps', 'api', 'src', 'models', 'adminAccess.model.ts'],
  ['apps', 'api', 'src', 'models', 'adminAuthorizationState.model.ts'],
  ['apps', 'api', 'src', 'middlewares', 'admin-permission.middleware.ts'],
  ['apps', 'api', 'src', 'services', 'admin-access.service.ts'],
  ['apps', 'api', 'src', 'services', 'admin-permission-evaluator.ts'],
  ['apps', 'api', 'src', 'services', 'admin-access-policy.ts'],
  ['apps', 'api', 'src', 'services', 'admin-owner.service.ts'],
  ['apps', 'admin', 'src', 'lib', 'permissions', 'admin-permissions.ts'],
  ['apps', 'admin', 'src', 'lib', 'permissions', 'admin-access.ts'],
  ['apps', 'admin', 'src', 'lib', 'permissions', 'can-admin.ts'],
  [
    'apps',
    'admin',
    'src',
    'providers',
    'AdminAuthorizationProvider',
    'AdminAuthorizationProvider.tsx',
  ],
  ['apps', 'admin', 'src', 'components', 'auth', 'AdminPermissionGate.tsx'],
  ['apps', 'admin', 'src', 'app', 'api', 'admin', 'access', 'me', 'route.ts'],
];

for (const file of requiredFiles) {
  assert.equal(
    await exists(...file),
    true,
    `Stage 8 file must exist: ${file.join('/')}`
  );
}

//===================================================================

const authConstants = await read('apps', 'api', 'src', 'constants', 'auth.ts');

const backendPermissions = await read(
  'apps',
  'api',
  'src',
  'constants',
  'admin-permissions.ts'
);

const frontendPermissions = await read(
  'apps',
  'admin',
  'src',
  'lib',
  'permissions',
  'admin-permissions.ts'
);

const accessModel = await read(
  'apps',
  'api',
  'src',
  'models',
  'adminAccess.model.ts'
);

const apiAdminRoutes = await read(
  'apps',
  'api',
  'src',
  'routes',
  'admin.routes.ts'
);

const permissionMiddleware = await read(
  'apps',
  'api',
  'src',
  'middlewares',
  'admin-permission.middleware.ts'
);

const adminController = await read(
  'apps',
  'api',
  'src',
  'controllers',
  'admin.controller.ts'
);

const jwt = await read('apps', 'api', 'src', 'utils', 'jwt.ts');

const backendAccessCodes = await read(
  'apps',
  'api',
  'src',
  'constants',
  'admin-access.ts'
);

const frontendAccessCodes = await read(
  'apps',
  'admin',
  'src',
  'lib',
  'permissions',
  'admin-access.ts'
);

const ownerService = await read(
  'apps',
  'api',
  'src',
  'services',
  'admin-owner.service.ts'
);

const policy = await read(
  'apps',
  'api',
  'src',
  'services',
  'admin-access-policy.ts'
);

const seedOwner = await read(
  'apps',
  'api',
  'src',
  'scripts',
  'seed-admin-owner.ts'
);

const adminLayout = await read(
  'apps',
  'admin',
  'src',
  'app',
  'admin',
  'layout.tsx'
);
const navigation = await read(
  'apps',
  'admin',
  'src',
  'lib',
  'layout',
  'navigation.ts'
);

const routes = await read(
  'apps',
  'admin',
  'src',
  'lib',
  'routes',
  'admin-routes.ts'
);

const provider = await read(
  'apps',
  'admin',
  'src',
  'providers',
  'AdminAuthorizationProvider',
  'AdminAuthorizationProvider.tsx'
);

const gate = await read(
  'apps',
  'admin',
  'src',
  'components',
  'auth',
  'AdminPermissionGate.tsx'
);

const browserApi = await read(
  'apps',
  'admin',
  'src',
  'lib',
  'api',
  'browser',
  'admin-access.api.ts'
);

const bffRoute = await read(
  'apps',
  'admin',
  'src',
  'app',
  'api',
  'admin',
  'access',
  'me',
  'route.ts'
);

//===================================================================

assert.match(authConstants, /CLIENT:\s*['"]client['"]/);
assert.match(authConstants, /PHARMACY:\s*['"]pharmacy['"]/);
assert.match(authConstants, /ADMIN:\s*['"]admin['"]/);

assert.doesNotMatch(
  authConstants,
  /super_admin|platform_owner|accountant|moderator|support_admin/
);

const backendPermissionValues = extractPermissionCalls(backendPermissions);
const frontendPermissionValues = extractPermissionCalls(frontendPermissions);

assert.deepEqual(
  frontendPermissionValues,
  backendPermissionValues,
  'Backend and admin frontend permission registries must stay in parity'
);

const extractAccessCodes = (source) =>
  [
    ...source.matchAll(
      /:\s*['"](ADMIN_[A-Z_]+|PLATFORM_OWNER_REQUIRED|LAST_PLATFORM_OWNER)['"]/g
    ),
  ]
    .map((match) => match[1])
    .sort();

assert.deepEqual(
  extractAccessCodes(frontendAccessCodes),
  extractAccessCodes(backendAccessCodes),
  'Backend and frontend admin access error codes must stay in parity'
);

for (const permission of [
  'pharmacyOwners.view',
  'pharmacies.moderate',
  'products.delete',
  'productRequests.moderate',
  'clients.view',
  'orders.view',
  'productReviews.moderate',
  'pharmacyReviews.moderate',
  'sitePages.publish',
  'categories.delete',
  'employees.managePermissions',
  'employees.revokeAccess',
  'positions.delete',
  'audit.view',
]) {
  assert.ok(
    backendPermissionValues.includes(permission),
    `Missing permission ${permission}`
  );
}

//===================================================================

assert.match(accessModel, /userId:[\s\S]*unique:\s*true/);
assert.match(accessModel, /isPlatformOwner/);
assert.match(accessModel, /ADMIN_ACCESS_STATUSES/);
assert.match(accessModel, /normalizeAdminPermissions/);
assert.doesNotMatch(accessModel, /position(?:Id)?/i);

assert.match(permissionMiddleware, /resolveAdminAuthorization/);
assert.match(permissionMiddleware, /requireAdminPermission/);
assert.match(permissionMiddleware, /hasAdminPermission/);

assert.match(apiAdminRoutes, /resolveAdminAuthorization/);
assert.match(apiAdminRoutes, /['"]\/access\/me['"]/);
assert.match(apiAdminRoutes, /ADMIN_PERMISSIONS\.pharmacyOwners\.edit/);
assert.match(apiAdminRoutes, /ADMIN_PERMISSIONS\.pharmacies\.view/);
assert.match(apiAdminRoutes, /ADMIN_PERMISSIONS\.pharmacies\.moderate/);
assert.match(apiAdminRoutes, /ADMIN_PERMISSIONS\.productRequests\.moderate/);
assert.match(adminController, /Cache-Control['"],\s*['"]no-store/);

assert.doesNotMatch(jwt, /permissions|isPlatformOwner/);
assert.match(jwt, /userId:\s*string/);
assert.match(jwt, /role:\s*UserRole/);

//===================================================================

assert.match(policy, /SELF_ACCESS_CHANGE_NOT_ALLOWED/);
assert.match(policy, /OWNER_ACCESS_PROTECTED/);
assert.match(policy, /PERMISSION_DELEGATION_DENIED/);
assert.match(policy, /actor\.permissions\.includes/);

assert.match(ownerService, /withTransaction/);
assert.match(ownerService, /AdminAuthorizationState\.findOneAndUpdate/);
assert.match(ownerService, /ownerRevision/);
assert.match(ownerService, /countDocuments/);
assert.match(ownerService, /LAST_PLATFORM_OWNER/);
assert.match(ownerService, /PLATFORM_OWNER_REQUIRED/);

assert.match(seedOwner, /AdminAccess/);
assert.match(seedOwner, /isPlatformOwner:\s*true/);
assert.match(seedOwner, /ADMIN_OWNER_/);
assert.doesNotMatch(seedOwner, /admin@example|first admin becomes owner/i);

//===================================================================

assert.match(adminLayout, /AdminProtectedRoute/);
assert.match(adminLayout, /AdminAuthorizationProvider/);
assert.match(adminLayout, /<AdminAuthorizationProvider>[\s\S]*<AdminShell>/);

assert.match(provider, /getCurrentAdminAccess/);
assert.match(provider, /Checking admin permissions/);
assert.match(provider, /ACCESS_REVOKED/);
assert.match(provider, /Admin access has been revoked/);
assert.match(provider, /Admin access is unavailable/);
assert.doesNotMatch(provider, /localStorage|sessionStorage/);

assert.match(gate, /canAdmin\(access, permission\)/);
assert.doesNotMatch(gate, /user\.role|position/i);

assert.match(browserApi, /localApiRequest/);
assert.match(browserApi, /parseAdminAccessResponse/);
assert.match(bffRoute, /createPrivateProxyRoute/);
assert.match(bffRoute, /apiRoutes\.admin\.accessMe/);

//===================================================================

assert.match(
  routes,
  /SETTINGS_POSITIONS:\s*['"]\/admin\/settings\/positions['"]/
);

assert.match(navigation, /label:\s*['"]Positions['"]/);
assert.match(navigation, /ADMIN_PERMISSIONS\.positions\.view/);
assert.match(navigation, /getAdminNavigationForAccess/);
assert.match(navigation, /canAdmin\(access, child\.requiredPermission\)/);
assert.match(navigation, /children\.length > 0/);
assert.doesNotMatch(navigation, /position(?:Id)?\s*===|position\s*===/i);
assert.doesNotMatch(navigation, /label:\s*['"]Roles['"]/);

//===================================================================

const uiFiles = await collectFiles(
  path.join(ROOT_DIR, 'packages', 'ui', 'src')
);

for (const file of uiFiles.filter((file) => /\.(?:ts|tsx)$/.test(file))) {
  const source = await readFile(file, 'utf8');
  assert.doesNotMatch(
    source,
    /isPlatformOwner|employees\.managePermissions|products\.edit|AdminPermission/,
    `Shared UI must not own admin authorization: ${path.relative(ROOT_DIR, file)}`
  );
}

for (const futurePage of [
  ['settings', 'employees', 'page.tsx'],
  ['settings', 'positions', 'page.tsx'],
  ['pharmacies', 'page.tsx'],
  ['products', 'page.tsx'],
  ['reviews', 'pharmacies', 'page.tsx'],
  ['reviews', 'products', 'page.tsx'],
  ['settings', 'site-pages', 'page.tsx'],
  ['settings', 'categories', 'page.tsx'],
]) {
  assert.equal(
    await exists('apps', 'admin', 'src', 'app', 'admin', ...futurePage),
    false,
    `Stage 8 must not create CRUD placeholder ${futurePage.join('/')}`
  );
}

//===================================================================

const rootPackage = JSON.parse(await read('package.json'));
const check = 'pnpm check:admin-permissions';

assert.equal(
  rootPackage.scripts['check:admin-permissions'],
  'node scripts/checks/admin/check-admin-permissions.mjs'
);

for (const scriptName of ['check:admin', 'check:before-deploy']) {
  const steps = rootPackage.scripts[scriptName].split(/\s*&&\s*/);
  assert.equal(steps.filter((step) => step === check).length, 1);
  assert.ok(steps.indexOf(check) > steps.indexOf('pnpm check:admin-shell'));
}

console.log(
  'Admin Stage 8 permissions and Platform Owner structural check passed.'
);
