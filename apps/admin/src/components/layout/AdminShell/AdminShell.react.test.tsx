import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

//===================================================================

const read = (relativePath: string) =>
  readFileSync(new URL(relativePath, import.meta.url), 'utf8');

const shellSource = read('./AdminShell.tsx');
const headerSource = read('../AdminHeader/AdminHeader.tsx');
const sidebarSource = read('../AdminSidebar/AdminSidebar.tsx');
const mobileSource = read('../AdminMobileMenu/AdminMobileMenu.tsx');

//===================================================================

test('admin cabinet composes shared shell primitives without business fetching', () => {
  assert.match(shellSource, /<AdminSidebar/);
  assert.match(shellSource, /<AdminHeader/);
  assert.match(shellSource, /getAdminBreadcrumbsByPathname/);
  assert.match(shellSource, /pathname === ADMIN_ROUTES\.PROFILE/);

  assert.doesNotMatch(
    shellSource,
    /\bfetch\s*\(|localApiRequest|getDashboard|getOrders|getPharmacies/
  );
});

//===================================================================

test('admin header reuses shared fullscreen and user dropdown mechanics', () => {
  assert.match(headerSource, /FullscreenButton/);
  assert.match(headerSource, /UserDropdown/);
  assert.match(headerSource, /CabinetTopBar/);
  assert.match(headerSource, /UserBadge/);
  assert.match(headerSource, /useAdminLogoutController/);
  assert.match(headerSource, /ADMIN_ROUTES\.PROFILE/);

  assert.doesNotMatch(
    headerSource,
    /requestFullscreen|exitFullscreen|fullscreenchange|useOutsidePointerDown/
  );
});

//===================================================================

test('desktop and mobile navigation consume the same canonical admin model', () => {
  assert.match(shellSource, /getAdminNavigationForAccess/);
  assert.match(sidebarSource, /items=\{items\}/);
  assert.match(mobileSource, /items=\{items\}/);
  assert.match(mobileSource, /onNavigate=\{onClose\}/);
  assert.match(mobileSource, /ADMIN_ROUTES\.PROFILE/);
});
