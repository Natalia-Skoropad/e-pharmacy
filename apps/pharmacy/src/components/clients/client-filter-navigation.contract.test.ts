import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

//===================================================================

const read = (path: string) =>
  readFileSync(resolve(process.cwd(), 'src', path), 'utf8');

//===================================================================

test('two-segment owner Clients filter routes cannot be swallowed by client detail tabs', () => {
  const tab = read('app/pharmacy/clients/[clientId]/[tab]/page.tsx');
  const branch = tab.indexOf("if (route.kind === 'filters')");
  const invalidGuard = tab.indexOf('if (!isValidObjectId(clientId)');

  assert.match(tab, /resolveClientsRoute\(\[clientId, tab\]\)/);

  assert.ok(
    branch > -1 && invalidGuard > branch,
    'filter routing must run before detail ID validation'
  );

  assert.match(tab, /<ClientsPageContent initialFilters=\{filters\}/);

  assert.match(
    tab,
    /if \(`\/pharmacy\/clients\/\$\{clientId\}\/\$\{tab\}` !== canonical\) redirect\(canonical\)/
  );

  assert.match(tab, /SUPPORTED_TABS = \['orders', 'products', 'comments'\]/);
});

//===================================================================

test('single and catch-all owner Clients filter URLs are canonicalized on the server', () => {
  const single = read('app/pharmacy/clients/[clientId]/page.tsx');
  const catchAll = read('app/pharmacy/clients/[[...filters]]/page.tsx');

  for (const source of [single, catchAll]) {
    assert.match(source, /buildClientsPath\(filters\)/);
    assert.match(source, /redirect\(canonical\)/);
    assert.match(source, /<ClientsPageContent initialFilters=\{filters\}/);
  }
});

//===================================================================

test('owner Clients filter navigation creates history entries and preserves pharmacy tab behavior', () => {
  const page = read(
    'components/clients/ClientsPageContent/ClientsPageContent.tsx'
  );

  const change =
    page
      .split('const handleFiltersChange =')[1]
      ?.split('const handleRowsPerPageChange =')[0] ?? '';

  const reset =
    page
      .split('const resetFilters =')[1]
      ?.split('const getClientStatisticHref =')[0] ?? '';

  assert.match(change, /router.push\(nextPath, \{ scroll: false \}\)/);
  assert.doesNotMatch(change, /router.replace/);

  assert.match(
    reset,
    /router.push\(PHARMACY_ROUTES.CLIENTS, \{ scroll: false \}\)/
  );

  assert.match(reset, /if \(embedded\) \{[\s\S]*?router.replace\(/);
  assert.doesNotMatch(page, /usePathname|pendingRoutePathRef/);
});

//===================================================================

test('Walk-in client pharmacy label is used in both search and table from existing row data', () => {
  const search = read(
    'components/clients/OwnerClientSearch/OwnerClientSearch.tsx'
  );

  const table = read('components/clients/ClientsTable/ClientsTable.tsx');
  const label = read('lib/clients/client-display-name.ts');

  assert.match(search, /label: getClientDisplayName\(client\)/);
  assert.match(table, /\{getClientDisplayName\(client\)\}/);
  assert.match(label, /client\.isDefault && client\.pharmacyName/);
  assert.match(label, /\$\{client\.name\} \(\$\{client\.pharmacyName\}\)/);
});
