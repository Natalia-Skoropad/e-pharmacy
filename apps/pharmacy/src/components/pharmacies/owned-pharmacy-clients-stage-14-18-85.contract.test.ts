import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

//===================================================================

const read = (name: string) =>
  readFileSync(join(process.cwd(), 'src', name), 'utf8');

//===================================================================

test('pharmacy detail does not show global selection and Clients has its own section header', () => {
  const detail = read(
    'components/pharmacies/OwnedPharmacyDetailPageContent/OwnedPharmacyDetailPageContent.tsx'
  );

  const selector = read(
    'components/layout/PharmacyShell/PharmacySelectionControls.tsx'
  );

  const clients = read(
    'components/clients/ClientsPageContent/ClientsPageContent.tsx'
  );

  assert.match(selector, /getPharmacyIdFromDetailPath\(pathname\)/);
  assert.match(detail, /<ProfileSectionHeader/);
  assert.match(detail, /visibleTab === 'clients'/);
  assert.match(clients, /!embedded \? <PageHeader/);
  assert.match(clients, /<StatsLoadingSkeleton/);

  assert.match(
    clients,
    /isLoading=\{clientsStatus === 'idle' \|\| clientsStatus === 'loading'\}/
  );
});

//===================================================================

test('nested Clients route keeps filters, search and paging within the selected pharmacy', () => {
  const page = read(
    'components/clients/ClientsPageContent/ClientsPageContent.tsx'
  );

  const search = read(
    'components/clients/OwnerClientSearch/OwnerClientSearch.tsx'
  );

  const route = read('app/pharmacy/pharmacies/[...filters]/page.tsx');

  assert.match(route, /parseClientsSegments/);
  assert.match(route, /parseClientsPaginationSegments/);
  assert.match(route, /initialClientFilters=\{clientFilters\}/);

  assert.match(
    page,
    /router\.replace\(buildClientsPath\(routeFilters, basePath/
  );

  assert.match(page, /resetHref=\{basePath\}/);
  assert.match(page, /embedded=\{embedded\}/);
  assert.match(search, /scope: embedded \? undefined : 'owner'/);
  assert.match(page, /fullWidthOnMobile/);
});

//===================================================================

test('pharmacy-specific product requests route and tab are removed, without changing owner requests', () => {
  const url = read('lib/pharmacies/owned-pharmacy-url.ts');

  const detail = read(
    'components/pharmacies/OwnedPharmacyDetailPageContent/OwnedPharmacyDetailPageContent.tsx'
  );

  assert.doesNotMatch(url, /'product-requests'/);

  assert.doesNotMatch(
    detail,
    /<ProductRequestsPageContent|value: 'product-requests'/
  );

  assert.match(read('lib/routes/pharmacy-routes.ts'), /PRODUCT_REQUESTS:/);
});

//===================================================================

test('sales chart error uses shared resource state with retry', () => {
  const chart = read(
    'components/pharmacies/OwnedPharmacyDetailPageContent/OwnedPharmacySalesChart.tsx'
  );

  assert.match(chart, /variant="error"/);
  assert.match(chart, /sideActionOnDesktop/);
  assert.match(chart, /onRetry=\{\(\) => setRetry/);
});
