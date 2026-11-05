import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

//===================================================================

async function readLayoutSource(relativePath: string): Promise<string> {
  return readFile(new URL(relativePath, import.meta.url), 'utf8');
}

//===================================================================

test('desktop and mobile logout share one pharmacy application lifecycle owner', async () => {
  const [header, mobileMenu, controller] = await Promise.all([
    readLayoutSource('./PharmacyHeader/PharmacyHeader.tsx'),
    readLayoutSource('./PharmacyMobileMenu/PharmacyMobileMenu.tsx'),
    readLayoutSource('./hooks/usePharmacyLogoutController.ts'),
  ]);

  assert.match(header, /usePharmacyLogoutController\(logout\)/);
  assert.match(header, /isLogoutPending=\{isLogoutPending\}/);
  assert.match(header, /onLogout=\{logoutFromPharmacy\}/);

  assert.doesNotMatch(mobileMenu, /getSharedLoginUrl/);
  assert.doesNotMatch(mobileMenu, /setIsLogoutLoading/);
  assert.match(mobileMenu, /onLogout\(onClose\)/);

  assert.match(
    controller,
    /window\.location\.replace\(getSharedLoginUrl\(\)\)/
  );

  assert.doesNotMatch(controller, /window\.location\.assign/);
});

//===================================================================

test('shared fullscreen UI is capability-gated and cleans up browser subscriptions', async () => {
  const [header, fullscreenButton] = await Promise.all([
    readLayoutSource('./PharmacyHeader/PharmacyHeader.tsx'),

    readLayoutSource(
      '../../../../../packages/ui/src/cabinet/FullscreenButton/FullscreenButton.tsx'
    ),
  ]);

  assert.match(header, /FullscreenButton/);

  assert.doesNotMatch(
    header,
    /fullscreenchange|isFullscreenAvailable|toggleFullscreen/
  );

  assert.match(fullscreenButton, /isFullscreenAvailable\(document\)/);

  assert.match(
    fullscreenButton,
    /document\.addEventListener\('fullscreenchange', handleFullscreenChange\)/
  );

  assert.match(
    fullscreenButton,
    /document\.removeEventListener\('fullscreenchange', handleFullscreenChange\)/
  );

  assert.doesNotMatch(fullscreenButton, /console\.error/);
});

//===================================================================

test('sidebar hides counters after a current-generation request failure', async () => {
  const sidebar = await readLayoutSource(
    './PharmacySidebar/PharmacySidebar.tsx'
  );

  assert.match(sidebar, /createUnavailableOrderCounterState/);

  // Ignore unrelated catch blocks and guard only the order-counter request.
  const orderCounterFailure = sidebar.match(
    /catch \(error\) \{([\s\S]*?)\n      \} finally/
  );

  assert.ok(orderCounterFailure, 'Order-counter errors must be handled');

  assert.match(
    orderCounterFailure[1] ?? '',
    /controller\.signal\.aborted \|\| currentVersion !== requestVersion/
  );

  assert.match(
    orderCounterFailure[1] ?? '',
    /setOrderCounterState\(createUnavailableOrderCounterState\(\)\)/
  );

  assert.match(sidebar, /const orderCounts = getVisibleOrderCounts/);
});
