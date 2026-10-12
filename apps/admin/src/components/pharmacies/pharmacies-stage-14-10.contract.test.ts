import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

//===================================================================

const read = (path: string) => readFile(new URL(path, import.meta.url), 'utf8');

//===================================================================

test('Stage 14.10 table has exactly 13 required columns in the requested order', async () => {
  const content = await read(
    './PharmaciesPageContent/PharmaciesPageContent.tsx'
  );

  const columns = content
    .split('const columns = useMemo')[1]
    ?.split('\n  return (')[0];

  assert.ok(columns);

  const keys = [...columns.matchAll(/key: '([^']+)'/g)].map(
    (match) => match[1]
  );

  assert.deepEqual(keys, [
    'createdAt',
    'photo',
    'id',
    'name',
    'owner',
    'email',
    'phone',
    'address',
    'activeClientsCount',
    'successfulOrdersCount',
    'successfulRevenue',
    'rating',
    'status',
  ]);

  assert.match(columns, /TableImagePreview/);
  assert.match(columns, /formatInitials/);
  assert.match(columns, /buildAdminPharmacyDetailUrl/);
  assert.match(columns, /buildAdminPharmacyOwnerDetailUrl/);
  assert.match(columns, /formatPharmacyLocation/);
  assert.match(columns, /formatMoney\(pharmacy\.successfulRevenue\)/);
  assert.match(columns, /RatingSummary/);
  assert.match(columns, /'No reviews'/);
  assert.match(columns, /PHARMACY_STATUS_PRESENTATION\[pharmacy\.status\]/);
  assert.doesNotMatch(content, /Create pharmacy|Add pharmacy/);
});

//===================================================================

test('both independent ID selectors search server options, debounce and restore selected ID', async () => {
  const content = await read(
    './PharmaciesPageContent/PharmaciesPageContent.tsx'
  );

  const pharmacy = await read('./PharmacySearch/PharmacySearch.tsx');

  const owner = await read(
    '../pharmacy-owners/PharmacyOwnerSearch/PharmacyOwnerSearch.tsx'
  );

  assert.match(content, /<PharmacySearch/);
  assert.match(content, /value=\{state\.pharmacyId\}/);
  assert.match(content, /<PharmacyOwnerSearch/);
  assert.match(content, /loadOptions=\{getAdminPharmacyRegistryOwnerOptions\}/);
  assert.match(content, /value=\{state\.ownerId\}/);
  assert.match(pharmacy, /useDebouncedValue\(query\.trim\(\), 250\)/);
  assert.match(owner, /useDebouncedValue\(query\.trim\(\), 250\)/);
  assert.match(pharmacy, /getAdminPharmacyOptions/);
  assert.match(pharmacy, /signal: controller\.signal/);
  assert.match(pharmacy, /search: value/);
  assert.match(pharmacy, /value=\{value\}/);
  assert.match(content, /buildAdminPharmaciesListUrl\(nextState\)/);
  assert.match(content, /const state = initialState/);
});

//===================================================================

test('creation date, status and no-gap ratings use existing URL-backed registry filtering', async () => {
  const content = await read(
    './PharmaciesPageContent/PharmaciesPageContent.tsx'
  );

  const drawer = await read(
    './PharmaciesFiltersDrawer/PharmaciesFiltersDrawer.tsx'
  );

  assert.match(drawer, /<FilterDrawer/);
  assert.match(drawer, /<DateFilter/);
  assert.match(drawer, /minDate=\{minDate\}/);

  assert.match(
    drawer,
    /maxDate=\{getBusinessCalendarDate\(\) \?\? undefined\}/
  );

  assert.match(drawer, /ADMIN_PHARMACY_STATUSES\.map/);
  assert.match(drawer, /ADMIN_PHARMACY_RATINGS\.map/);
  assert.match(drawer, /createdFrom: from, createdTo: to, page: 1/);
  assert.match(drawer, /status, page: 1/);
  assert.match(drawer, /rating, page: 1/);
  assert.match(content, /buildAdminPharmaciesListApiParams\(state\)/);
  assert.match(content, /perPage: state\.perPage/);
  assert.match(content, /<RowsPerPageSelect/);
  assert.match(content, /<CountLabel/);
  assert.match(content, /<PaginationView/);
  assert.match(content, /minWidth=\{1800\}/);
  assert.match(content, /setListRetry\(\(retry\) => retry \+ 1\)/);
  assert.match(content, /setStatsRetry\(\(retry\) => retry \+ 1\)/);
});

//===================================================================

test('owner autocomplete uses pharmacies.view and exposes only minimal linked owner identity', async () => {
  const backend = await read('../../../../api/src/routes/admin.routes.ts');

  const service = await read(
    '../../../../api/src/services/admin-pharmacy-registry-read.service.ts'
  );

  const contract = await read(
    '../../../../../packages/api-client/src/contracts/backend-resource-routes.ts'
  );

  const browser = await read(
    '../../lib/api/browser/admin-pharmacy-registry.api.ts'
  );

  const bff = await read(
    '../../app/api/admin/pharmacies/owner-options/route.ts'
  );

  const route = backend.indexOf("'/pharmacies/owner-options'");
  assert.ok(route > -1);

  assert.match(
    backend.slice(route, route + 260),
    /ADMIN_PERMISSIONS\.pharmacies\.view/
  );

  assert.match(service, /listAdminPharmacyRegistryOwnerOptionsService/);
  assert.match(service, /'_linkedPharmacies\.0'/);
  assert.match(service, /pictureUrl: \{ \$ifNull/);

  const projection = service
    .split('listAdminPharmacyRegistryOwnerOptionsService')[1]
    ?.split('return {')[0];

  assert.ok(projection);
  assert.doesNotMatch(projection, /email: 1|phone: 1/);
  assert.match(contract, /ownerOptions: '\/admin\/pharmacies\/owner-options'/);
  assert.match(browser, /parseAdminPharmacyRegistryOwnerOptionsResponse/);
  assert.match(bff, /createPrivateProxyRoute/);
  assert.match(bff, /API_ROUTES\.admin\.pharmacyRegistry\.ownerOptions/);
});
