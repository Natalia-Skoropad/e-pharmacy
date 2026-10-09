import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

//===================================================================

const component = readFileSync(
  new URL('./AdminProfilePageContent.tsx', import.meta.url),
  'utf8'
);

const route = readFileSync(
  new URL('../../../app/admin/profile/[tab]/page.tsx', import.meta.url),
  'utf8'
);

//===================================================================

test('admin profile tabs have valid direct URL routes and browser history sync', () => {
  assert.match(component, /usePathname/);
  assert.match(component, /window\.history\.pushState/);
  assert.match(component, /ADMIN_ROUTES\.PROFILE/);

  for (const tab of ['documents', 'comments', 'sessions']) {
    assert.match(route, new RegExp(`'${tab}'`));
  }

  assert.match(route, /notFound\(\)/);
});
