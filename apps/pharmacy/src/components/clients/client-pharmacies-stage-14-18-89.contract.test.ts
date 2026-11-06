import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

//===============================================================

const read = (path: string) =>
  readFileSync(resolve(process.cwd(), 'src', path), 'utf8');

//===============================================================

test('client statistics are visible on every desktop tab but hidden on mobile', () => {
  const page = read(
    'components/clients/ClientDetailsPageContent/ClientDetailsPageContent.tsx'
  );

  const styles = read(
    'components/clients/ClientDetailsPageContent/ClientDetailsPageContent.module.css'
  );

  assert.match(page, /<div className=\{css\.statisticsBlock\}>/);

  assert.doesNotMatch(
    page,
    /activeTab === 'pharmacies' \|\| clientStatus === 'error'/
  );

  assert.match(styles, /\.statisticsBlock\s*\{\s*display: none;/);

  assert.match(
    styles,
    /@media only screen and \(min-width: 768px\)\s*\{\s*\.statisticsBlock\s*\{\s*display: grid;/
  );
});

//===============================================================

test('client pharmacies use the owner registry presentation, filters and table loader', () => {
  const page = read(
    'components/clients/ClientDetailsPageContent/ClientDetailsPageContent.tsx'
  );

  const tab = read(
    'components/clients/ClientPharmaciesTab/ClientPharmaciesTab.tsx'
  );

  assert.match(page, /\{activeTab === 'pharmacies' \? \(/);
  assert.match(tab, /<ProfileSectionHeader/);
  assert.match(tab, /<OwnedPharmacySearch/);
  assert.match(tab, /<OwnedPharmaciesFiltersDrawer/);
  assert.match(tab, /<DataTable/);
  assert.match(tab, /isLoading=\{isLoading\}/);
  assert.match(tab, /<RowsPerPageSelect/);
  assert.match(tab, /<PaginationView/);
  assert.doesNotMatch(tab, /No pharmacies with orders/);
  assert.doesNotMatch(tab, /Create pharmacy/);

  for (const column of [
    'createdAt',
    'photo',
    'pharmacyId',
    'name',
    'successfulOrdersCount',
    'successfulOrdersAmount',
    'rating',
    'status',
  ]) {
    assert.match(tab, new RegExp(`key: '${column}'`));
  }
});

//===============================================================

test('client-specific tooltip and comments use shared presentation', () => {
  const tab = read(
    'components/clients/ClientPharmaciesTab/ClientPharmaciesTab.tsx'
  );

  const page = read(
    'components/clients/ClientDetailsPageContent/ClientDetailsPageContent.tsx'
  );

  const browser = read('lib/api/browser/clients.api.ts');

  assert.match(tab, /title="Successful orders — this client"/);
  assert.match(tab, /this specific client placed at this pharmacy/);
  assert.match(tab, /this specific client’s Successful orders/);

  assert.match(
    page,
    /entityKey=\{`client:\$\{clientId\}`\}[\s\S]*?presentation="profile"/
  );

  assert.match(page, /emptyTitle="No internal comments yet"/);
  assert.match(browser, /parseOwnedPharmacyListResponse/);
  assert.match(browser, /successfulRevenue: row.successfulOrdersAmount/);
});
