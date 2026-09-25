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
  ['apps', 'admin', 'src', 'app', 'admin', 'profile', 'page.tsx'],
  [
    'apps',
    'admin',
    'src',
    'components',
    'profile',
    'AdminProfilePageContent',
    'AdminProfilePageContent.tsx',
  ],
  [
    'apps',
    'admin',
    'src',
    'app',
    'api',
    'admin',
    'employees',
    'me',
    'profile',
    'route.ts',
  ],
  ['apps', 'api', 'src', 'models', 'adminEmployeeDocument.model.ts'],
  ['apps', 'api', 'src', 'models', 'adminEmployeePrivateNote.model.ts'],
  ['apps', 'api', 'src', 'services', 'admin-employee-profile.service.ts'],
  ['apps', 'api', 'src', 'services', 'admin-employee-document.service.ts'],
  ['apps', 'api', 'src', 'services', 'admin-employee-note.service.ts'],
];

for (const file of requiredFiles) {
  assert.equal(
    await exists(...file),
    true,
    `Stage 10 profile file must exist: ${file.join('/')}`
  );
}

//===================================================================

const [
  adminLayout,
  adminRoutes,
  header,
  mobileMenu,
  breadcrumbs,
  permissions,
  profileContent,
  profileBrowserApi,
  profileBff,
  authMeBff,
  passwordBff,
  sessionsBff,
  sessionBff,
  backendRoutes,
  profileService,
  documentService,
  privateNoteService,
  documentModel,
] = await Promise.all([
  read('apps', 'admin', 'src', 'app', 'admin', 'layout.tsx'),
  read('apps', 'admin', 'src', 'lib', 'routes', 'admin-routes.ts'),

  read(
    'apps',
    'admin',
    'src',
    'components',
    'layout',
    'AdminHeader',
    'AdminHeader.tsx'
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

  read('apps', 'admin', 'src', 'lib', 'layout', 'breadcrumbs.ts'),
  read('apps', 'api', 'src', 'constants', 'admin-permissions.ts'),

  read(
    'apps',
    'admin',
    'src',
    'components',
    'profile',
    'AdminProfilePageContent',
    'AdminProfilePageContent.tsx'
  ),

  read('apps', 'admin', 'src', 'lib', 'api', 'browser', 'admin-profile.api.ts'),

  read(
    'apps',
    'admin',
    'src',
    'app',
    'api',
    'admin',
    'employees',
    'me',
    'profile',
    'route.ts'
  ),

  read('apps', 'admin', 'src', 'app', 'api', 'auth', 'me', 'route.ts'),
  read('apps', 'admin', 'src', 'app', 'api', 'auth', 'password', 'route.ts'),
  read('apps', 'admin', 'src', 'app', 'api', 'auth', 'sessions', 'route.ts'),

  read(
    'apps',
    'admin',
    'src',
    'app',
    'api',
    'auth',
    'sessions',
    '[sessionId]',
    'route.ts'
  ),

  read('apps', 'api', 'src', 'routes', 'admin.routes.ts'),
  read('apps', 'api', 'src', 'services', 'admin-employee-profile.service.ts'),
  read('apps', 'api', 'src', 'services', 'admin-employee-document.service.ts'),
  read('apps', 'api', 'src', 'services', 'admin-employee-note.service.ts'),
  read('apps', 'api', 'src', 'models', 'adminEmployeeDocument.model.ts'),
]);

assert.match(adminLayout, /AdminProtectedRoute/);
assert.match(adminLayout, /AdminShell/);
assert.match(adminRoutes, /PROFILE:\s*['"]\/admin\/profile['"]/);

assert.match(
  header,
  /label:\s*['"]Profile['"][\s\S]*href:\s*ADMIN_ROUTES\.PROFILE/
);

assert.match(mobileMenu, /href=\{ADMIN_ROUTES\.PROFILE\}/);

assert.match(
  breadcrumbs,
  /href:\s*ADMIN_ROUTES\.PROFILE,\s*label:\s*['"]Profile['"]/
);

assert.doesNotMatch(permissions, /profile\s*:/);
assert.doesNotMatch(permissions, /editSelf|profile\.view|profile\.edit/);

assert.match(profileContent, /@e-pharmacy\/ui\/profile/);
assert.match(profileContent, /ProfileIdentityCard/);
assert.match(profileContent, /ProfilePictureEditor/);
assert.match(profileContent, /ChangePasswordForm/);
assert.match(profileContent, /ActiveSessionsPanel/);
assert.match(profileContent, /ProfileTabsLayout/);
assert.match(profileContent, /access\.isPlatformOwner/);
assert.match(profileContent, /expectedRevision:\s*user\.revision/);
assert.match(profileContent, /applyCurrentUser\(response\.user\)/);
assert.match(profileContent, /activeTab === DOCUMENTS_TAB \? /);
assert.match(profileContent, /activeTab === COMMENTS_TAB \? /);
assert.match(profileContent, /activeTab !== SESSIONS_TAB/);

assert.match(profileBrowserApi, /ADMIN_API_ROUTES\.adminEmployees\.myProfile/);
assert.match(profileBrowserApi, /localApiRequest/);

assert.doesNotMatch(
  profileBrowserApi,
  /https?:\/\/|API_BASE_URL|NEXT_PUBLIC_API_URL/
);

assert.match(profileBff, /createPrivateProxyRoute/);
assert.match(profileBff, /apiRoutes\.admin\.employees\.myProfile/);
assert.match(profileBff, /method:\s*['"]PATCH['"]/);
assert.doesNotMatch(authMeBff, /export const PATCH/);

assert.match(passwordBff, /authRoutes\.password/);
assert.match(sessionsBff, /authRoutes\.sessions/);
assert.match(sessionBff, /authRoutes\.session\(sessionId\)/);

assert.match(backendRoutes, /'\/employees\/me\/profile'/);
assert.doesNotMatch(backendRoutes, /employees\/:employeeId\/profile/);

assert.match(profileService, /authorization\.isPlatformOwner/);

assert.match(
  profileService,
  /ADMIN_ACCESS_ERROR_CODES\.PLATFORM_OWNER_REQUIRED/
);

assert.match(profileService, /updatedAt:\s*expectedRevision/);
assert.match(profileService, /appendAdminAuditLog/);
assert.match(profileService, /session\.withTransaction/);

assert.match(documentModel, /content:[\s\S]*select:\s*false/);
assert.doesNotMatch(documentModel, /PharmacyDocumentFile/);
assert.match(documentService, /ownerUserId:\s*userId/);
assert.match(documentService, /authorization\.isPlatformOwner/);

assert.match(privateNoteService, /const filter = \{ ownerUserId: userId \}/);
assert.match(privateNoteService, /clientRequestId/);
assert.doesNotMatch(privateNoteService, /isPlatformOwner/);
assert.doesNotMatch(privateNoteService, /appendAdminAuditLog/);

//===================================================================

const rootPackage = JSON.parse(await read('package.json'));
const profileCheck = 'pnpm check:admin-profile';

assert.equal(
  rootPackage.scripts['check:admin-profile'],
  'node scripts/checks/admin/check-admin-profile.mjs'
);

for (const scriptName of ['check:admin', 'check:before-deploy']) {
  const steps = rootPackage.scripts[scriptName].split(/\s*&&\s*/);

  assert.equal(
    steps.filter((step) => step === profileCheck).length,
    1,
    `${profileCheck} must run exactly once in ${scriptName}`
  );
}

console.log('Admin Stage 10 profile structural checks passed.');
