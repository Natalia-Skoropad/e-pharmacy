import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

//===================================================================

const read = (relativePath: string) =>
  readFile(new URL(relativePath, import.meta.url), 'utf8');

//===================================================================

test('pharmacy owners list page is permission-gated and URL-driven', async () => {
  const page = await read('../../app/admin/pharmacy-owners/page.tsx');

  const content = await read(
    './PharmacyOwnersPageContent/PharmacyOwnersPageContent.tsx'
  );

  assert.match(page, /ADMIN_PERMISSIONS\.pharmacyOwners\.view/);
  assert.match(page, /parseAdminPharmacyOwnersListSearchParams/);
  assert.match(content, /buildAdminPharmacyOwnersListUrl/);
  assert.match(content, /buildAdminPharmacyOwnerListApiParams/);
  assert.match(content, /router\.replace/);
});

//===================================================================

test('pharmacy owners list covers analytics search filters pagination and distinct empty states', async () => {
  const content = await read(
    './PharmacyOwnersPageContent/PharmacyOwnersPageContent.tsx'
  );

  const search = await read('./PharmacyOwnerSearch/PharmacyOwnerSearch.tsx');

  const filters = await read(
    './PharmacyOwnersFiltersDrawer/PharmacyOwnersFiltersDrawer.tsx'
  );

  assert.match(content, /getAdminPharmacyOwnerSummary/);
  assert.match(content, /StatsCard/);
  assert.match(content, /status: 'new'/);
  assert.match(content, /status: 'active'/);
  assert.match(content, /status: 'blocked'/);
  assert.match(content, /RowsPerPageSelect/);
  assert.match(content, /CountLabel/);
  assert.match(content, /PaginationView/);
  assert.match(content, /No pharmacy owners match the selected filters\./);
  assert.match(content, /No pharmacy owners have registered yet\./);
  assert.match(content, /Pharmacy owners could not be loaded/);
  assert.match(content, /StatsLoadingSkeleton/);
  assert.match(content, /<UserCog/);

  assert.match(search, /getAdminPharmacyOwnerOptions/);
  assert.match(search, /SearchableSelect/);
  assert.match(search, /InfoTooltip/);
  assert.match(search, /TableImagePreview/);
  assert.match(search, /owner\.name/);

  assert.match(filters, /DateFilter/);
  assert.match(filters, /Registration date/);
  assert.match(filters, /Account status/);
  assert.match(filters, /onReset/);
});

//===================================================================

test('owners table links ids and names to owner detail and uses canonical status badges', async () => {
  const table = await read('./PharmacyOwnersTable/PharmacyOwnersTable.tsx');

  assert.match(table, /key: 'registeredAt'/);
  assert.match(table, /parts=\{\['Reg\.', 'date'\]\}/);
  assert.match(table, /Owner's[\s\S]*?photo/);
  assert.match(table, /parts=\{\['Active', 'pharms'\]\}/);
  assert.match(table, /Active and inactive pharmacies/);
  assert.match(table, /InfoTooltip/);
  assert.match(table, /parts=\{\['Inactive', 'pharms'\]\}/);
  assert.match(table, /buildAdminPharmacyOwnerDetailUrl\(owner\.id\)/);
  assert.match(table, /USER_STATUS_PRESENTATION\[owner\.status\]/);

  // Preserve readable desktop-sized columns with horizontal scrolling on narrow screens.
  assert.match(table, /minWidth=\{1000\}/);
  assert.doesNotMatch(table, /Create|Add owner/);
});
