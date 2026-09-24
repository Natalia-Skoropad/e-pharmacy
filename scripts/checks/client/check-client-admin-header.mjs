import assert from 'node:assert/strict';
import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

//===================================================================

const root = process.cwd();
const read = (relativePath) => readFile(path.join(root, relativePath), 'utf8');

//===================================================================

async function exists(relativePath) {
  try {
    await access(path.join(root, relativePath));
    return true;
  } catch {
    return false;
  }
}

//===================================================================

async function listFiles(directory) {
  const absoluteDirectory = path.join(root, directory);
  const files = [];

  for (const entry of await readdir(absoluteDirectory, {
    withFileTypes: true,
  })) {
    const relativePath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await listFiles(relativePath)));
    else files.push(relativePath);
  }

  return files;
}

//===================================================================

const [
  header,
  headerStyles,
  mobile,
  mobileStyles,
  controller,
  authIndex,
  externalConfig,
  adminConfigCore,
  adminConfig,
  clientEnv,
  clientReadme,
  rootReadme,
] = await Promise.all([
  read('apps/client/src/components/layout/Header/Header.tsx'),
  read('apps/client/src/components/layout/Header/Header.module.css'),
  read('apps/client/src/components/layout/MobileOffcanvas/MobileOffcanvas.tsx'),

  read(
    'apps/client/src/components/layout/MobileOffcanvas/MobileOffcanvas.module.css'
  ),

  read('apps/client/src/components/layout/hooks/usePublicHeaderController.ts'),
  read('apps/client/src/lib/auth/index.ts'),
  read('apps/client/src/lib/auth/external-app-config-core.ts'),
  read('apps/client/src/lib/auth/admin-app-config-core.ts'),
  read('apps/client/src/lib/auth/admin-app-config.ts'),
  read('apps/client/.env.example'),
  read('apps/client/README.md'),
  read('README.md'),
]);

//===================================================================

assert.match(
  clientEnv,
  /^NEXT_PUBLIC_ADMIN_APP_URL=http:\/\/localhost:3001$/m,
  'Client env example must document the local admin application base URL.'
);

assert.match(clientReadme, /NEXT_PUBLIC_ADMIN_APP_URL/);
assert.match(rootReadme, /NEXT_PUBLIC_ADMIN_APP_URL=http:\/\/localhost:3001/);

assert.match(
  externalConfig,
  /resolveExternalAppConfiguration/,
  'External application URL validation must remain client-local and reusable.'
);

assert.match(adminConfigCore, /ADMIN_DASHBOARD_PATH = '\/admin\/dashboard'/);

assert.match(
  adminConfigCore,
  /DEVELOPMENT_ADMIN_APP_URL = 'http:\/\/localhost:3001'/
);

assert.match(adminConfigCore, /resolveExternalAppConfiguration/);
assert.match(adminConfig, /process\.env\.NEXT_PUBLIC_ADMIN_APP_URL/);
assert.match(adminConfig, /getAdminDashboardUrl\(\): string \| null/);
assert.match(authIndex, /getAdminDashboardUrl/);

for (const source of [header, mobile]) {
  assert.match(
    source,
    /import \{ UserBadge \} from '@e-pharmacy\/ui\/data-display'/,
    'Admin cabinet integration must reuse the shared UserBadge.'
  );

  assert.match(source, /meta="Admin cabinet"/);
  assert.match(source, /fallbackLabel="Admin"/);
  assert.match(source, /href=\{controller\.adminDashboardUrl\}/);
  assert.match(source, /name=\{authState\.user\.name\}/);
  assert.match(source, /pictureUrl=\{authState\.user\.pictureUrl\}/);

  assert.match(
    source,
    /renderLink=\{\(\{ href, className, children, onClick \}\) => \([\s\S]*?<a className=\{className\} href=\{href\} onClick=\{onClick\}>/,
    'Admin cabinet must use a real anchor for cross-application navigation.'
  );

  assert.doesNotMatch(source, /Use the admin application for account tools\./);
  assert.doesNotMatch(source, /AdminUserBadge/);
}

assert.match(header, /className=\{css\.cabinetBadge\}/);
assert.match(mobile, /className=\{css\.cabinetBadge\}/);
assert.match(mobile, /variant="dark"/);
assert.match(mobile, /onClick=\{onClose\}/);
assert.doesNotMatch(headerStyles, /pharmacyCabinetBadge/);
assert.doesNotMatch(mobileStyles, /pharmacyCabinetBadge/);
assert.match(headerStyles, /\.cabinetBadge\s*\{/);
assert.match(mobileStyles, /\.cabinetBadge\s*\{/);

assert.match(
  controller,
  /const isAdminMode = authState\.mode === 'authenticated-admin'/
);

assert.match(
  controller,
  /const adminDashboardUrl = isAdminMode \? getAdminDashboardUrl\(\) : null/
);

assert.match(controller, /isAdminMode,/);
assert.match(controller, /adminDashboardUrl,/);

assert.doesNotMatch(
  controller,
  /adminSummaryState|adminUserId|getCurrentAdminSummary/
);

assert.doesNotMatch(controller, /fetchAdmin|\/api\/admin|\/admin\/profile/);

// Keep the historical client/admin-header boundary valid as the admin app evolves.
// `/admin/profile` is part of Stage 10.4, so it must no longer be treated as
// forbidden by this Stage 5 regression check. The dashboard is still outside
// the current stage, and legacy flat shell component paths must remain absent.
for (const forbiddenPath of [
  'apps/admin/src/app/admin/dashboard/page.tsx',
  'apps/admin/src/components/layout/AdminHeader.tsx',
  'apps/admin/src/components/layout/AdminSidebar.tsx',
]) {
  assert.equal(
    await exists(forbiddenPath),
    false,
    `${forbiddenPath} is outside the current admin stage or is a legacy shell path.`
  );
}

const clientComponentFiles = await listFiles('apps/client/src/components');

assert.equal(
  clientComponentFiles.some((file) => /AdminUserBadge/i.test(file)),
  false,
  'A client-local AdminUserBadge must not be introduced.'
);

console.log(
  'Client admin-header compatibility contracts passed through Stage 10.4.'
);
