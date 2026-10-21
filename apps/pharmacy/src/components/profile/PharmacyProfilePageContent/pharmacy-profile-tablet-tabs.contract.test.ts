import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

//===================================================================

const profile = readFileSync(
  new URL('./PharmacyProfilePageContent.tsx', import.meta.url),
  'utf8'
);

//===================================================================

test('owner profile displays every tab on tablets but keeps standard mobile menu', () => {
  assert.match(
    profile,
    /<ProfileTabsLayout[\s\S]*?tabletVisibleCount=\{TABS\.length\}/
  );

  assert.doesNotMatch(profile, /mobileVisibleCount=\{TABS\.length\}/);
});
