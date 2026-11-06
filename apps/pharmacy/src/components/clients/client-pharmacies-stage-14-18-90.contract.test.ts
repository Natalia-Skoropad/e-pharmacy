import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

//===============================================================

const read = (path: string) =>
  readFileSync(resolve(process.cwd(), 'src', path), 'utf8');

//===============================================================

test('client pharmacies use canonical server-side filter routes with browser history', () => {
  const base = read('app/pharmacy/clients/[clientId]/pharmacies/page.tsx');

  const nested = read(
    'app/pharmacy/clients/[clientId]/pharmacies/[...filters]/page.tsx'
  );

  const paths = read('lib/clients/client-pharmacies-path.ts');

  const tab = read(
    'components/clients/ClientPharmaciesTab/ClientPharmaciesTab.tsx'
  );

  const parent = read(
    'components/clients/ClientDetailsPageContent/ClientDetailsPageContent.tsx'
  );

  const breadcrumbs = read('lib/layout/breadcrumbs.ts');

  assert.match(
    base,
    /initialPharmacyFilters=\{OWNED_PHARMACIES_LIST_URL_DEFAULTS\}/
  );

  assert.match(nested, /parseClientPharmaciesSegments\(filters\)/);
  assert.match(nested, /buildClientPharmaciesPath\(clientId, state\)/);
  assert.match(nested, /redirect\(canonical\)/);
  assert.match(nested, /notFound\(\)/);
  assert.match(paths, /buildOwnedPharmaciesListUrl\(state\)/);
  assert.match(paths, /parseOwnedPharmaciesListSegments/);
  assert.match(paths, /date-from-/);
  assert.match(paths, /date-to-/);
  assert.match(paths, /buildOwnedPharmaciesListUrl/); // pagination lives in canonical registry builder

  assert.match(
    tab,
    /router\.push\(buildClientPharmaciesPath\(clientId, value\)/
  );

  assert.match(tab, /router\.replace\(buildClientPharmaciesPath\(clientId/);
  assert.doesNotMatch(tab, /const \[state, setState\]/);
  assert.match(parent, /initialState=\{initialPharmacyFilters\}/);

  assert.match(
    breadcrumbs,
    /route.segments.length === 2 \|\| tab === 'pharmacies'/
  );
});

//===============================================================

test('table help floats outside scrolling container with the order icon', () => {
  const tab = read(
    'components/clients/ClientPharmaciesTab/ClientPharmaciesTab.tsx'
  );

  const help = tab.slice(
    tab.indexOf('title="Successful orders — this client"')
  );

  assert.match(help, /icon=\{<ShoppingBag/);
  assert.match(help, /escapeOverflow/);
  assert.match(help, /preferTopLayer/);
  assert.match(tab, /<DataTable/);
  assert.match(tab, /<OwnedPharmaciesFiltersDrawer/);
});

//===============================================================

test('comments display the shared pharmacy form without blocking client loader', () => {
  const parent = read(
    'components/clients/ClientDetailsPageContent/ClientDetailsPageContent.tsx'
  );

  assert.match(
    parent,
    /activeTab !== 'comments' && clientStatus !== 'success'/
  );

  assert.match(parent, /\{activeTab === 'comments' \? \(/);
  assert.match(parent, /<EntityComments/);
  assert.match(parent, /presentation="profile"/);
});

//===============================================================

test('client-note browser calls opt into membership-scoped backend for all methods', () => {
  const source = read('lib/api/browser/pharmacy-notes.api.ts');

  assert.equal(
    (source.match(/type === 'client' \? \{ scope: 'client' \} : \{\}/g) ?? [])
      .length,
    3
  );

  assert.match(
    source,
    /\{ page, perPage: 10, \.\.\.\(type === 'client' \? \{ scope: 'client' \} : \{\}\) \}/
  );

  assert.match(source, /method: 'POST'/);
  assert.match(source, /method: 'DELETE'/);
});
