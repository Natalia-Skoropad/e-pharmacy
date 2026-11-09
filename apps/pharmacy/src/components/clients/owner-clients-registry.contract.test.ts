import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

//===================================================================

const read = (path: string) =>
  readFileSync(resolve(process.cwd(), 'src', path), 'utf8');

//===================================================================

test('owner Clients page is global while embedded tab remains selected-pharmacy-scoped', () => {
  const page = read(
    'components/clients/ClientsPageContent/ClientsPageContent.tsx'
  );

  const api = read('lib/api/browser/clients.api.ts');

  const shell = read(
    'components/layout/PharmacyShell/PharmacyCabinetBoundary.tsx'
  );

  const provider = read(
    'providers/PharmacySelectionProvider/PharmacySelectionProvider.tsx'
  );

  const scope = read('lib/pharmacies/selected-pharmacy-scope.ts');

  assert.match(page, /const ownerScope = !embedded/);
  assert.doesNotMatch(page, /showPharmacy/);
  assert.match(page, /<OwnerClientSearch/);
  assert.match(page, /\{ scope: 'owner' as const \}/);

  assert.match(
    api,
    /params\.scope === 'owner' \? localApiRequest : operationalLocalApiRequest/
  );

  assert.match(shell, /isOwnerClientsListPath\(pathname\)/);
  assert.match(shell, /isOwnerClientDetailPath\(pathname\)/);
  assert.match(provider, /query\.delete\('pharmacyId'\)/);
  assert.match(scope, /isOwnerClientDetailPath\(pathname: string\)/);
  assert.match(scope, /!isOwnerClientDetailPath\(pathname\)/);
});

//===================================================================

test('owner Clients uses one search and preserves the original columns without Pharmacy', () => {
  const page = read(
    'components/clients/ClientsPageContent/ClientsPageContent.tsx'
  );

  const drawer = read(
    'components/clients/ClientsFiltersDrawer/ClientsFiltersDrawer.tsx'
  );

  const table = read('components/clients/ClientsTable/ClientsTable.tsx');

  assert.doesNotMatch(page, /<OwnedPharmacySearch/);
  assert.doesNotMatch(drawer, /<OwnedPharmacySearch/);

  for (const name of [
    'firstOrderAt',
    'photo',
    'clientId',
    'name',
    'email',
    'phone',
    'address',
    'successfulOrdersCount',
    'successfulOrdersAmount',
    'status',
  ]) {
    assert.match(table, new RegExp(`key: '${name}'`));
  }

  assert.doesNotMatch(table, /key: 'pharmacy'/);
  assert.match(table, /getPharmacyClientPath\(client\.id\)/);
});

//===================================================================

test('owner Clients search reuses searchable select and searches all five authorized client fields', () => {
  const page = read(
    'components/clients/ClientsPageContent/ClientsPageContent.tsx'
  );

  const search = read(
    'components/clients/OwnerClientSearch/OwnerClientSearch.tsx'
  );

  const backend = read(
    '../../api/src/services/clients/client-registry-filters.ts'
  );

  assert.match(page, /<OwnerClientSearch/);
  assert.match(search, /<SearchableSelect/);
  assert.match(search, /label="Client search"/);
  assert.match(search, /by ID, name, email, phone number, or address/);

  assert.match(
    search,
    /scope: productId \|\| !embedded \? 'owner' : undefined/
  );

  assert.match(search, /uniqueClients\(result\.items\)/);

  for (const key of ['id', 'name', 'email', 'phone', 'address']) {
    assert.match(backend, new RegExp(`\\{ ${key}: search \\}`));
  }

  assert.match(page, /fullWidthOnMobile/);
  assert.match(page, /<StatsLoadingSkeleton/);
});

//===================================================================

test('client filters use status badges, per-option order icons and no nested pharmacy search', () => {
  const drawer = read(
    'components/clients/ClientsFiltersDrawer/ClientsFiltersDrawer.tsx'
  );

  const aggregation = read(
    '../../api/src/services/clients/client-registry-aggregation.ts'
  );

  assert.match(
    drawer,
    /<StatusBadge \{\.\.\.USER_STATUS_PRESENTATION\[status\]\}/
  );

  for (const icon of ['CheckCircle2', 'Repeat2', 'CircleMinus']) {
    assert.match(drawer, new RegExp(`<${icon} `));
  }

  assert.doesNotMatch(drawer, /<OwnedPharmacySearch/);
  assert.match(aggregation, /earliestOrderAt: \{ \$min: '\$firstOrderAt' \}/);
});

//===================================================================

test('statistics error uses shared resource state, skeleton owns its layout, active status highlights', () => {
  const clients = read(
    'components/clients/ClientsPageContent/ClientsPageContent.tsx'
  );

  const pharmacies = read(
    'components/pharmacies/OwnedPharmaciesPageContent/OwnedPharmaciesPageContent.tsx'
  );

  const css = read(
    'components/clients/ClientsPageContent/ClientsPageContent.module.css'
  );

  const stat = read(
    'components/statistics/ClientStatistics/ClientStatistics.tsx'
  );

  const drawer = read(
    'components/clients/ClientsFiltersDrawer/ClientsFiltersDrawer.tsx'
  );

  assert.match(
    clients,
    /<ProfileResourceState[\s\S]*?title="Client statistics could not be loaded"/
  );

  assert.match(
    pharmacies,
    /<ProfileResourceState[\s\S]*?title="Pharmacy statistics could not be loaded"/
  );

  assert.match(clients, /className=\{css.statisticsSkeleton\}/);
  assert.doesNotMatch(css, /\.statisticsSkeleton\s*\{[^}]*display:\s*grid/);
  assert.match(css, /\.clientStatistics\s*\{\s*display:\s*grid/);
  assert.match(stat, /activeKey === key \? css.activeCard/);
  assert.doesNotMatch(drawer, /ListChecks/);
});

//===================================================================

test('client pharmacy detail has a bookmarkable owner-scoped tab without exposing other owners', () => {
  const detail = read(
    'components/clients/ClientDetailsPageContent/ClientDetailsPageContent.tsx'
  );

  const tab = read(
    'components/clients/ClientPharmaciesTab/ClientPharmaciesTab.tsx'
  );

  const page = read('app/pharmacy/clients/[clientId]/pharmacies/page.tsx');
  const browser = read('lib/api/browser/clients.api.ts');

  assert.match(detail, /value: 'pharmacies'/);
  assert.match(detail, /<ClientPharmaciesTab[\s\S]*?clientId=\{clientId\}/);
  assert.match(page, /isValidObjectId\(clientId\)/);
  assert.match(page, /initialTab="pharmacies"/);

  assert.match(
    detail,
    /router.push\(tab === 'details' \? base : `\$\{base\}\/\$\{tab\}`/
  );

  assert.match(tab, /getClientPharmacies\(clientId/);
  assert.match(tab, /getOwnedPharmacyPath\(item.pharmacyId\)/);
  assert.match(browser, /await localApiRequest\(path/);
});
