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

  assert.match(css, /\.userDropdownDesktop\s*\{[\s\S]*display:\s*none;/);

  assert.match(
    css,
    /@media only screen and \(min-width: 1440px\)[\s\S]*\.userDropdownDesktop\s*\{[\s\S]*display:\s*block;/
  );

  assert.match(source, /matchMedia\(DESKTOP_MEDIA_QUERY\)/);
  assert.match(source, /subscribeToDesktopBreakpoint/);
  assert.match(source, /<UserDropdown/);
});

//===================================================================

test('shared account popover owns disclosure semantics and Escape focus restoration', async () => {
  const [headerSource, dropdownSource, dropdownCss] = await Promise.all([
    readFile(new URL('./PharmacyHeader.tsx', import.meta.url), 'utf8'),

    readFile(
      new URL(
        '../../../../../../packages/ui/src/cabinet/UserDropdown/UserDropdown.tsx',
        import.meta.url
      ),
      'utf8'
    ),

    readFile(
      new URL(
        '../../../../../../packages/ui/src/cabinet/UserDropdown/UserDropdown.module.css',
        import.meta.url
      ),
      'utf8'
    ),
  ]);

  assert.equal(dropdownSource.includes('role="menu"'), false);
  assert.equal(dropdownSource.includes('role="menuitem"'), false);
  assert.match(dropdownSource, /aria-expanded=\{isOpen\}/);
  assert.match(dropdownSource, /triggerRef\.current\?\.focus\(\)/);

  assert.match(
    dropdownCss,
    /\.trigger:focus-visible[\s\S]*outline:\s*2px solid var\(--color-white\)/
  );

  assert.doesNotMatch(headerSource, /useOutsidePointerDown/);
  assert.doesNotMatch(headerSource, /userMenuButtonRef/);
});
