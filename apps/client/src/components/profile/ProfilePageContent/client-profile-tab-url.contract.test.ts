import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

//===================================================================

const component = readFileSync(
  new URL('./ProfilePageContent.tsx', import.meta.url),
  'utf8'
);
const route = readFileSync(
  new URL('../../../app/(private)/profile/[tab]/page.tsx', import.meta.url),
  'utf8'
);

//===================================================================

test('client profile tabs have allowlisted direct URL routes and history sync', () => {
  assert.match(component, /usePathname/);
  assert.match(component, /window\.history\.pushState/);
  assert.match(component, /mobileVisibleCount=\{1\}/);
  assert.match(component, /tabletVisibleCount=\{3\}/);
  assert.match(component, /activeTab === 'favorite-products'/);

  for (const tab of [
    'orders',
    'favorite-products',
    'favorite-pharmacies',
    'sessions',
  ]) {
    assert.match(route, new RegExp(`'${tab}'`));
  }

  assert.match(route, /notFound\(\)/);
});
