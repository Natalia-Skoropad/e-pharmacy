import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';

//===================================================================

const root = process.cwd();
const read = (relativePath) => readFile(path.join(root, relativePath), 'utf8');

//===================================================================

async function assertMissing(relativePath, message) {
  try {
    await access(path.join(root, relativePath));
  } catch {
    return;
  }

  assert.fail(message);
}

//===================================================================

const [
  cabinetIndex,
  fullscreenButton,
  userDropdown,
  navigationTypes,
  sidebar,
  sideMenu,
  pharmacyHeader,
] = await Promise.all([
  read('packages/ui/src/cabinet/index.ts'),
  read('packages/ui/src/cabinet/FullscreenButton/FullscreenButton.tsx'),
  read('packages/ui/src/cabinet/UserDropdown/UserDropdown.tsx'),
  read('packages/ui/src/navigation/types.ts'),
  read('packages/ui/src/cabinet/CabinetSidebar/CabinetSidebar.tsx'),
  read('packages/ui/src/cabinet/SideMenu/SideMenu.tsx'),
  read('apps/pharmacy/src/components/layout/PharmacyHeader/PharmacyHeader.tsx'),
]);

//===================================================================

assert.match(cabinetIndex, /FullscreenButton/);
assert.match(cabinetIndex, /UserDropdown/);

assert.match(fullscreenButton, /fullscreenchange/);

assert.match(
  fullscreenButton,
  /aria-label=\{isFullscreen \? exitLabel : enterLabel\}/
);

assert.doesNotMatch(
  fullscreenButton,
  /apps\/(?:pharmacy|admin|client)|useAuth|router/
);

assert.match(userDropdown, /useOutsidePointerDown/);
assert.match(userDropdown, /aria-expanded=\{isOpen\}/);
assert.match(userDropdown, /event\.key !== 'Escape'/);

assert.doesNotMatch(
  userDropdown,
  /logoutFromPharmacy|PHARMACY_ROUTES|ADMIN_ROUTES|useAuth|usePharmacyProfile/
);

assert.match(navigationTypes, /export type NavigationLinkItem/);
assert.match(navigationTypes, /export type NavigationGroupItem/);
assert.match(navigationTypes, /type:\s*'group'/);

assert.match(
  navigationTypes,
  /children:\s*readonly NavigationLinkItem<TIcon>\[\]/
);

assert.doesNotMatch(navigationTypes, /children\?:\s*NavigationItem/);

for (const source of [sidebar, sideMenu]) {
  assert.match(source, /isNavigationGroup\(item\)/);
  assert.match(source, /isNavigationItemActive\(item, activePath\)/);
  assert.match(source, /aria-expanded=/);
  assert.match(source, /aria-controls=/);
}

assert.match(sidebar, /collapsedSubmenu/);
assert.match(sidebar, /useOutsidePointerDown/);
assert.match(sidebar, /event\.key !== 'Escape'/);

assert.match(pharmacyHeader, /FullscreenButton/);
assert.match(pharmacyHeader, /UserDropdown/);
assert.match(pharmacyHeader, /type:\s*'action'/);
assert.match(pharmacyHeader, /onSelect:\s*logoutFromPharmacy/);

assert.doesNotMatch(
  pharmacyHeader,
  /fullscreenchange|toggleFullscreen|isFullscreenAvailable/
);

assert.doesNotMatch(pharmacyHeader, /useOutsidePointerDown/);

await assertMissing(
  'apps/pharmacy/src/lib/layout/fullscreen.ts',
  'pharmacy-local fullscreen implementation must stay removed after Stage 6'
);

await assertMissing(
  'apps/pharmacy/src/lib/layout/fullscreen.test.ts',
  'pharmacy-local fullscreen tests must move with the shared fullscreen contract'
);

console.log(
  'Shared cabinet UI check passed (fullscreen, dropdown and one-level nested navigation contracts).'
);
