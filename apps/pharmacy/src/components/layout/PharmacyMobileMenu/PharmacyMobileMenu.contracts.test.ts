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

test('mobile menu styling does not depend on generated SideMenu internals', async () => {
  const [mobileCss, sharedCss] = await Promise.all([
    readFile(
      new URL('./PharmacyMobileMenu.module.css', import.meta.url),
      'utf8'
    ),

    readFile(
      new URL(
        '../../../../../../packages/ui/src/cabinet/SideMenu/SideMenu.module.css',
        import.meta.url
      ),
      'utf8'
    ),
  ]);

  assert.doesNotMatch(mobileCss, /SideMenu-module__/);
  assert.doesNotMatch(mobileCss, /span:last-child/);
  assert.match(sharedCss, /\.label\s*\{[\s\S]*font-size:\s*var\(--fz-14\)/);
  assert.match(sharedCss, /font-weight:\s*var\(--fw-medium\)/);
});
