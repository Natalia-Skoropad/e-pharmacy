import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

//===================================================================

function read(relativePath: string): string {
  return readFileSync(new URL(relativePath, import.meta.url), 'utf8');
}

//===================================================================

test('owner detail route restores linked-pharmacy URL state and renders the pharmacies tab only for Tab 2', () => {
  const page = read('../../app/admin/pharmacy-owners/[ownerId]/page.tsx');

  const detail = read(
    './PharmacyOwnerDetailsPageContent/PharmacyOwnerDetailsPageContent.tsx'
  );

  assert.match(page, /parseAdminPharmacyOwnerPharmaciesSearchParams/);
  assert.match(page, /initialPharmaciesState/);

  assert.match(detail, /activeTab === ['"]pharmacies['"]/);
  assert.match(detail, /<LinkedPharmaciesTab/);
  assert.match(detail, /initialState=\{initialPharmaciesState\}/);

  assert.match(detail, /Pharmacies \(\$\{tabCounts\.pharmacies\}\)/);
});

//===================================================================

test('linked pharmacies tab is URL-driven and includes search, modal filters, rows count and pagination', () => {
  const tab = read('./PharmacyOwnerDetailsPageContent/LinkedPharmaciesTab.tsx');

  assert.match(tab, /getAdminPharmacyOwnerPharmacies/);
  assert.match(tab, /buildAdminPharmacyOwnerPharmaciesApiParams/);
  assert.match(tab, /buildAdminPharmacyOwnerPharmaciesUrl/);
  assert.match(tab, /LinkedPharmacySearch/);
  assert.match(tab, /LinkedPharmaciesFiltersDrawer/);
  assert.match(tab, /RowsPerPageSelect/);
  assert.match(tab, /CountLabel/);
  assert.match(tab, /PaginationView/);
  assert.match(tab, /page: 1/);
});

//===================================================================

test('linked pharmacy filter drawer exposes created date, all canonical statuses and exact rating bands', () => {
  const drawer = read(
    './PharmacyOwnerDetailsPageContent/LinkedPharmaciesFiltersDrawer.tsx'
  );

  assert.match(drawer, /DateFilter/);
  assert.match(drawer, /Created date/);
  assert.match(drawer, /ADMIN_OWNER_PHARMACY_STATUSES/);
  assert.match(drawer, /PHARMACY_STATUS_PRESENTATION\[status\]\.label/);

  for (const rating of ['0-0.9', '1-1.9', '2-2.9', '3-3.9', '4-5']) {
    assert.match(
      drawer,
      new RegExp(`value: ['"]${rating.replace('.', '\\.')}['"]`)
    );
  }
});

//===================================================================

test('linked pharmacy search suggests pharmacy photo and name while supporting detail fields', () => {
  const search = read(
    './PharmacyOwnerDetailsPageContent/LinkedPharmacySearch.tsx'
  );

  assert.match(search, /TableImagePreview/);
  assert.match(search, /pharmacy\.name/);
  assert.match(search, /pharmacy\.email/);
  assert.match(search, /pharmacy\.phone/);
  assert.match(search, /ID, name, phone, email, or address/);
  assert.match(search, /getAdminPharmacyOwnerPharmacies/);
});

//===================================================================

test('linked pharmacies table exposes every Stage 13.10 column and keeps pharmacy status read-only', () => {
  const table = read(
    './PharmacyOwnerDetailsPageContent/LinkedPharmaciesTable.tsx'
  );

  for (const key of [
    'createdAt',
    'photo',
    'id',
    'name',
    'email',
    'phone',
    'address',
    'activeClientsCount',
    'successfulOrdersCount',
    'successfulRevenue',
    'rating',
    'status',
  ]) {
    assert.match(table, new RegExp(`key: ['"]${key}['"]`));
  }

  assert.match(table, /formatMoney\(pharmacy\.successfulRevenue\)/);
  assert.match(table, /RatingSummary/);
  assert.match(table, /reviewsCount=\{pharmacy\.reviewsCount\}/);
  assert.match(table, /StatusBadge/);
  assert.match(table, /PHARMACY_STATUS_PRESENTATION\[pharmacy\.status\]/);
  assert.match(table, /ADMIN_ROUTES\.PHARMACIES/);
  assert.match(table, /TextActionButton/);

  assert.doesNotMatch(
    table,
    /update.*PharmacyStatus|onStatusChange|ReasonModal/
  );
});
