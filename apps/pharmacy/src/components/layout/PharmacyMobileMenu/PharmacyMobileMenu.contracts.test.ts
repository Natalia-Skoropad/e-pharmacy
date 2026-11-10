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
