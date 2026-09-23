import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

//===================================================================

const CURRENT_FILE = fileURLToPath(import.meta.url);
const ROOT_DIR = path.resolve(path.dirname(CURRENT_FILE), '..', '..', '..');

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

const adminRead = (...segments) => read('apps', 'admin', ...segments);

//===================================================================

const requiredFiles = [
  ['src', 'components', 'layout', 'AdminShell', 'AdminShell.tsx'],
  ['src', 'components', 'layout', 'AdminHeader', 'AdminHeader.tsx'],
  ['src', 'components', 'layout', 'AdminSidebar', 'AdminSidebar.tsx'],
  ['src', 'components', 'layout', 'AdminMobileMenu', 'AdminMobileMenu.tsx'],
  ['src', 'components', 'layout', 'hooks', 'useAdminLogoutController.ts'],
  ['src', 'components', 'layout', 'hooks', 'admin-logout-lifecycle.ts'],
  ['src', 'lib', 'layout', 'navigation.ts'],
  ['src', 'lib', 'layout', 'breadcrumbs.ts'],
];

for (const file of requiredFiles) {
  assert.equal(
    await exists('apps', 'admin', ...file),
    true,
    `Stage 7 file must exist: ${file.join('/')}`
  );
}

const adminLayout = await adminRead('src', 'app', 'admin', 'layout.tsx');

const shell = await adminRead(
  'src',
  'components',
  'layout',
  'AdminShell',
  'AdminShell.tsx'
);

const header = await adminRead(
  'src',
  'components',
  'layout',
  'AdminHeader',
  'AdminHeader.tsx'
);

const sidebar = await adminRead(
  'src',
  'components',
  'layout',
  'AdminSidebar',
  'AdminSidebar.tsx'
);

const mobile = await adminRead(
  'src',
  'components',
  'layout',
  'AdminMobileMenu',
  'AdminMobileMenu.tsx'
);

const navigation = await adminRead('src', 'lib', 'layout', 'navigation.ts');
const breadcrumbs = await adminRead('src', 'lib', 'layout', 'breadcrumbs.ts');
const routes = await adminRead('src', 'lib', 'routes', 'admin-routes.ts');

const testResolver = await read(
  'scripts',
  'test-runners',
  'typescript-resolver-loader.mjs'
);

//===================================================================

assert.doesNotMatch(adminLayout, /['"]use client['"]/);
assert.match(adminLayout, /AdminProtectedRoute/);
assert.match(adminLayout, /AdminShell/);

assert.match(
  adminLayout,
  /<AdminProtectedRoute>[\s\S]*<AdminShell>\{children\}<\/AdminShell>[\s\S]*<\/AdminProtectedRoute>/
);

assert.match(shell, /^\s*['"]use client['"];?/);
assert.match(shell, /getAdminBreadcrumbsByPathname/);
assert.match(shell, /<AdminSidebar/);
assert.match(shell, /<AdminHeader/);
assert.match(shell, /getAdminNavigationForAccess/);

assert.doesNotMatch(
  shell,
  /\bfetch\s*\(|localApiRequest|['\"]Authorization['\"]|accessToken|refreshToken|getDashboard|getOrders|getPharmacies|getReviews|getEmployees/
);

assert.doesNotMatch(
  shell,
  /canAccessAdminPrivateRoutes|user\.role|user\.status/
);

//===================================================================

for (const sharedName of [
  'CabinetTopBar',
  'FullscreenButton',
  'UserDropdown',
]) {
  assert.match(header, new RegExp(`\\b${sharedName}\\b`));
}

assert.match(header, /@e-pharmacy\/ui\/cabinet/);
assert.match(header, /UserBadge/);
assert.match(header, /useAuth/);
assert.match(header, /useAdminLogoutController/);
assert.match(header, /getClientAppDestination/);
assert.match(header, /AdminMobileMenu/);
assert.match(header, /triggerLabel=['"]Open admin account menu['"]/);

assert.doesNotMatch(
  header,
  /requestFullscreen|exitFullscreen|fullscreenchange|useOutsidePointerDown|document\.addEventListener\(['"](?:mousedown|pointerdown|keydown)['"]/
);

assert.doesNotMatch(header, /\bfetch\s*\(|localApiRequest/);
assert.doesNotMatch(header, /NEXT_PUBLIC_CLIENT_APP_URL/);

//===================================================================

assert.match(sidebar, /CabinetSidebar/);
assert.match(sidebar, /items=\{items\}/);
assert.match(sidebar, /activePath=\{pathname\}/);
assert.doesNotMatch(sidebar, /PHARMACY_NAVIGATION|PharmacySidebar/);

assert.match(mobile, /SideMenu/);
assert.match(mobile, /items=\{items\}/);
assert.match(mobile, /onNavigate=\{onClose\}/);
assert.match(mobile, /MobileOffcanvasBase/);
assert.match(mobile, /UserBadge/);
assert.match(mobile, /LogoutButton/);
assert.doesNotMatch(mobile, /PHARMACY_NAVIGATION|PharmacyMobileMenu/);

//===================================================================

for (const label of [
  'Dashboard',
  'Pharmacy Owners',
  'Pharmacies',
  'Products',
  'Product Requests',
  'Clients',
  'Orders',
  'Reviews',
  'Pharmacy reviews',
  'Product reviews',
  'Settings',
  'Employees',
  'Positions',
  'Site pages',
  'Product categories',
]) {
  assert.match(
    navigation,
    new RegExp(
      `label:\\s*['"]${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`
    )
  );
}

assert.match(
  navigation,
  /type:\s*['"]group['"][\s\S]*label:\s*['"]Reviews['"]/
);

assert.match(
  navigation,
  /type:\s*['"]group['"][\s\S]*label:\s*['"]Settings['"]/
);

assert.doesNotMatch(navigation, /label:\s*['"]Roles['"]/);

for (const routeName of [
  'DASHBOARD',
  'PHARMACY_OWNERS',
  'PHARMACIES',
  'PRODUCTS',
  'PRODUCT_REQUESTS',
  'CLIENTS',
  'ORDERS',
  'REVIEWS_PHARMACIES',
  'REVIEWS_PRODUCTS',
  'SETTINGS_EMPLOYEES',
  'SETTINGS_POSITIONS',
  'SETTINGS_SITE_PAGES',
  'SETTINGS_PRODUCT_CATEGORIES',
]) {
  assert.match(navigation, new RegExp(`ADMIN_ROUTES\\.${routeName}`));
  assert.match(routes, new RegExp(`${routeName}:`));
}

assert.match(breadcrumbs, /getAdminBreadcrumbsByPathname/);
assert.match(breadcrumbs, /ADMIN_ROUTES/);
assert.doesNotMatch(breadcrumbs, /useState|selected|activeItem/);

assert.match(
  testResolver,
  /client\|pharmacy\|admin/,
  'TypeScript test resolver must support the admin @/ alias'
);

//===================================================================

for (const futurePage of [
  ['dashboard', 'page.tsx'],
  ['pharmacy-owners', 'page.tsx'],
  ['pharmacies', 'page.tsx'],
  ['products', 'page.tsx'],
  ['product-requests', 'page.tsx'],
  ['clients', 'page.tsx'],
  ['orders', 'page.tsx'],
  ['reviews', 'pharmacies', 'page.tsx'],
  ['reviews', 'products', 'page.tsx'],
  ['settings', 'employees', 'page.tsx'],
  ['settings', 'positions', 'page.tsx'],
  ['settings', 'site-pages', 'page.tsx'],
  ['settings', 'categories', 'page.tsx'],
]) {
  assert.equal(
    await exists('apps', 'admin', 'src', 'app', 'admin', ...futurePage),
    false,
    `Stage 7 must not create placeholder page ${futurePage.join('/')}`
  );
}

//===================================================================

const rootPackage = JSON.parse(await read('package.json'));
const stage7Check = 'pnpm check:admin-shell';

assert.equal(
  rootPackage.scripts['check:admin-shell'],
  'node scripts/checks/admin/check-admin-shell.mjs'
);

for (const scriptName of ['check:admin', 'check:before-deploy']) {
  const steps = rootPackage.scripts[scriptName].split(/\s*&&\s*/);

  assert.equal(
    steps.filter((step) => step === stage7Check).length,
    1,
    `${stage7Check} must run exactly once in ${scriptName}`
  );

  assert.ok(
    steps.indexOf(stage7Check) >
      steps.indexOf('pnpm check:admin-protected-route'),
    `${stage7Check} must follow the protected-route contract`
  );
}

assert.ok(
  rootPackage.scripts['check:admin'].split(/\s*&&\s*/).indexOf(stage7Check) <
    rootPackage.scripts['check:admin']
      .split(/\s*&&\s*/)
      .indexOf('pnpm --filter @e-pharmacy/admin lint')
);

console.log('Admin Stage 7 shell structural check passed.');
