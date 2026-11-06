import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

//===============================================================

const read = (path: string) =>
  readFileSync(resolve(process.cwd(), 'src', path), 'utf8');

//===================================================================

test('client pharmacy filtered pages keep owner-wide selection behavior', () => {
  const scope = read('lib/pharmacies/selected-pharmacy-scope.ts');

  const filtered = read(
    'app/pharmacy/clients/[clientId]/pharmacies/[...filters]/page.tsx'
  );

  const path = read('lib/clients/client-pharmacies-path.ts');

  assert.match(
    scope,
    /parseClientPharmaciesSegments\(match\[2\]!\.split\('\/'\)\)/
  );

  assert.match(
    scope,
    /buildClientPharmaciesPath\(match\[1\]!, state\) === pathname/
  );

  assert.match(scope, /!isOwnerClientDetailPath\(pathname\)/);
  assert.match(filtered, /<ClientDetailsPageContent/);
  assert.match(path, /buildOwnedPharmaciesListUrl/);
  assert.match(path, /parseOwnedPharmaciesListSegments/);
});

//===================================================================

test('tablet client navigation shows five tabs, mobile retains its existing overflow', () => {
  const parent = read(
    'components/clients/ClientDetailsPageContent/ClientDetailsPageContent.tsx'
  );

  assert.match(parent, /mobileVisibleCount=\{1\}/);
  assert.match(parent, /tabletVisibleCount=\{5\}/);
  assert.doesNotMatch(parent, /`Comments \(\$\{commentsTotal\}\)`/);
  assert.match(parent, /label: 'Comments'/);
  assert.match(parent, /<EntityComments/);
});
