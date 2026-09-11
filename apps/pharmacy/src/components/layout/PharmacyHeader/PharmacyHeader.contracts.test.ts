import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

//===================================================================

test('header keeps mobile and desktop account controls mutually available', async () => {
  const css = await readFile(
    new URL('./PharmacyHeader.module.css', import.meta.url),
    'utf8'
  );

  const source = await readFile(
    new URL('./PharmacyHeader.tsx', import.meta.url),
    'utf8'
  );

  assert.match(css, /\.userMenuWrap\s*{[\s\S]*display:\s*none;/);

  assert.match(
    css,
    /@media only screen and \(min-width: 1440px\)[\s\S]*\.userMenuWrap\s*{[\s\S]*display:\s*block;/
  );

  assert.match(source, /matchMedia\(DESKTOP_MEDIA_QUERY\)/);
  assert.match(source, /subscribeToDesktopBreakpoint/);
});

//===================================================================

test('account popover uses native link/button semantics and restores focus on Escape', async () => {
  const source = await readFile(
    new URL('./PharmacyHeader.tsx', import.meta.url),
    'utf8'
  );

  const css = await readFile(
    new URL('./PharmacyHeader.module.css', import.meta.url),
    'utf8'
  );

  assert.equal(source.includes('role="menu"'), false);
  assert.equal(source.includes('role="menuitem"'), false);
  assert.match(source, /aria-expanded={isUserMenuOpen}/);
  assert.match(source, /userMenuButtonRef\.current\?\.focus\(\)/);

  assert.match(
    css,
    /\.userMenuButton:focus-visible[\s\S]*outline:\s*2px solid var\(--color-white\)/
  );
});
