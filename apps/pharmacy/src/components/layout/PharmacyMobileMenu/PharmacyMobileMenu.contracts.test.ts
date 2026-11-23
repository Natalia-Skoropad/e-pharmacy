import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

//===================================================================

test('mobile menu closes through explicit navigation actions and pathname lifecycle', async () => {
  const source = await readFile(
    new URL('./PharmacyMobileMenu.tsx', import.meta.url),
    'utf8'
  );

  assert.match(source, /shouldCloseMobileMenuForPathnameChange/);
  assert.match(source, /onNavigate=\{onClose\}/);
  assert.match(source, /onClick=\{onClose\}/);
  assert.match(source, /onLogout\(onClose\)/);
});

//===================================================================

test('mobile menu reuses owner order and request counters with matching status badges', async () => {
  const source = await readFile(
    new URL('./PharmacyMobileMenu.tsx', import.meta.url),
    'utf8'
  );

  const css = await readFile(
    new URL('./PharmacyMobileMenu.module.css', import.meta.url),
    'utf8'
  );

  assert.match(source, /useOrderNavigationCounts\(isOpen\)/);
  assert.match(source, /useProductRequestNavigationCounts\(isOpen\)/);
  assert.match(source, /item\.href === PHARMACY_ROUTES\.ORDERS/);
  assert.match(source, /item\.href === PHARMACY_ROUTES\.PRODUCT_REQUESTS/);

  for (const status of ['new', 'onModeration']) {
    assert.match(source, new RegExp(`productRequestCounts\\.${status} > 0`));
  }

  for (const selector of [
    'orderNewCounter',
    'orderProgressCounter',
    'moderationCounter',
  ]) {
    assert.match(css, new RegExp(`\\.${selector}\\s*\\{`));
  }

  assert.doesNotMatch(source, /productRequestCounts\.draft/);
  assert.doesNotMatch(source, /productRequestCounts\.inProgress/);
});
