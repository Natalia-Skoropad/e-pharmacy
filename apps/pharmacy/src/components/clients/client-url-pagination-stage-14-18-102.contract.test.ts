import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

//===================================================================

const {
  buildClientDetailPaginationPath,
  parseClientDetailPaginationPath,
  parseClientDetailPaginationSegments,
} = await import('../../lib/clients/client-detail-pagination');

//===================================================================

const read = (file: string) =>
  readFileSync(resolve(process.cwd(), 'src', file), 'utf8');

//===================================================================

const CLIENT_ID = '507f1f77bcf86cd799439011';

//===================================================================

test('client Orders/Products paging has canonical URLs and rejects unknown segments', () => {
  const base = `/pharmacy/clients/${CLIENT_ID}`;

  assert.equal(
    buildClientDetailPaginationPath(CLIENT_ID, 'orders', {
      page: 2,
      perPage: 50,
    }),
    `${base}/orders/per-page-50/page-2`
  );

  assert.deepEqual(
    parseClientDetailPaginationPath(
      `${base}/products/per-page-100/page-3`,
      CLIENT_ID,
      'products'
    ),
    { page: 3, perPage: 100 }
  );

  assert.deepEqual(parseClientDetailPaginationSegments([]), {
    page: 1,
    perPage: 20,
  });

  for (const invalid of [
    ['page-0'],
    ['per-page-15'],
    ['page-2', 'page-3'],
    ['unknown-filter'],
  ]) {
    assert.throws(() => parseClientDetailPaginationSegments(invalid));
  }
});

//===================================================================

test('owner Clients registry pagination is URL-driven end to end', () => {
  const route = read('lib/clients/client-paths.ts');

  const page = read(
    'components/clients/ClientsPageContent/ClientsPageContent.tsx'
  );

  const catchall = read('app/pharmacy/clients/[[...filters]]/page.tsx');
  const detail = read('app/pharmacy/clients/[clientId]/[tab]/page.tsx');
  const scope = read('lib/pharmacies/selected-pharmacy-scope.ts');

  assert.match(route, /\^page-\[1-9\]/);
  assert.match(route, /\^per-page-\(20\|50\|100\)/);
  assert.match(catchall, /parseClientsPaginationSegments/);
  assert.match(detail, /parseClientsPaginationSegments/);
  assert.match(page, /page: initialPage/);
  assert.match(page, /perPage: initialPerPage/);
  assert.match(page, /onPageChange=\{\(page\) => \{/);
  assert.match(page, /router\.push\(nextPath, \{ scroll: false \}\)/);
  assert.match(scope, /per-page-\(\?:20\|50\|100\)/);
  assert.doesNotMatch(page, /setPageState\(/);
});

//===================================================================

test('client pharmacy filters always read live pathname and fetch matching API query', () => {
  const tab = read(
    'components/clients/ClientPharmaciesTab/ClientPharmaciesTab.tsx'
  );

  const lib = read('lib/clients/client-pharmacies-path.ts');

  const service = read(
    '../../api/src/services/clients/client-pharmacies.service.ts'
  );

  assert.match(tab, /const pathname = usePathname\(\)/);
  assert.match(tab, /parseClientPharmaciesSegments\(/);
  assert.match(tab, /pathname\.slice\(base\.length \+ 1\)\.split\('\/'\)/);
  assert.match(tab, /buildOwnedPharmaciesListApiParams\(state\)/);
  assert.match(tab, /getClientPharmacies\(clientId, query/);

  assert.match(
    tab,
    /router\.push\(buildClientPharmaciesPath\(clientId, value\)/
  );

  assert.match(lib, /parseOwnedPharmaciesListSegments/);

  for (const key of [
    'pharmacyId',
    'status',
    'settlement',
    'region',
    'createdFrom',
    'createdTo',
    'rating',
  ]) {
    assert.match(service, new RegExp(`query\\.${key}`));
  }
});

//===================================================================

test('client detail Orders and Products use URL-backed page/perPage and preserve owner guards', () => {
  const page = read(
    'components/clients/ClientDetailsPageContent/ClientDetailsPageContent.tsx'
  );

  const route = read(
    'app/pharmacy/clients/[clientId]/[tab]/[...filters]/page.tsx'
  );

  const scope = read('lib/pharmacies/selected-pharmacy-scope.ts');

  assert.match(route, /parseClientDetailPaginationSegments/);
  assert.match(route, /resolveClientsRoute\(segments\)/);
  assert.match(route, /route\.kind === 'filters'/);
  assert.match(route, /buildClientDetailPaginationPath/);

  assert.match(
    page,
    /parseClientDetailPaginationPath\(pathname, clientId, 'orders'\)/
  );

  assert.match(
    page,
    /parseClientDetailPaginationPath\(pathname, clientId, 'products'\)/
  );

  assert.match(page, /onRowsPerPageChange=\{\(perPage\) => navigateTable/);
  assert.match(page, /onPageChange=\{\(page\) => navigateTable/);
  assert.match(scope, /detailPaging/);
});
