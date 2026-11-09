import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

//===================================================================

// Product feature contracts consolidated by domain, not by implementation stage.

{
  // Originally covered in owner-product-pharmacies-stage-14-18-136.contract.test.ts.
  const read = (path: string) => readFile(resolve(process.cwd(), path), 'utf8');

  const base = 'src/components/products/OwnProductDetailsPageContent/';

  test('Own product pharmacies has search, filters, and a table without statistics', async () => {
    const [tab, table, drawer] = await Promise.all([
      read(base + 'OwnProductPharmaciesTab.tsx'),
      read(base + 'OwnProductPharmaciesTable.tsx'),
      read(base + 'OwnProductPharmaciesFiltersDrawer.tsx'),
    ]);

    assert.doesNotMatch(
      tab,
      /getOwnedPharmacyStatistics|<OwnProductPharmaciesStatistics|<StatsLoadingSkeleton/
    );

    assert.match(tab, /<OwnedPharmacySearch/);
    assert.match(tab, /<OwnProductPharmaciesFiltersDrawer/);
    assert.match(tab, /<RowsPerPageSelect/);
    assert.match(tab, /<PaginationView/);
    assert.match(tab, /<OwnerAddProductConfirmation/);
    assert.match(table, /'inStock'/);
    assert.match(table, /'reserved'/);
    assert.match(table, /'available'/);
    assert.doesNotMatch(table, /key: 'availability'/);
    assert.doesNotMatch(table, /key: 'actions'/);
    assert.match(drawer, /availableDates=\{dates\}/);
  });

  test('canonical product pharmacies routes are wired to all supported route locations', async () => {
    const [nested, fallback, scope, tabs, breadcrumbs] = await Promise.all([
      read('src/app/pharmacy/products/[productId]/[tab]/[...filters]/page.tsx'),
      read('src/app/pharmacy/products/[[...filters]]/page.tsx'),
      read('src/lib/pharmacies/selected-pharmacy-scope.ts'),
      read('src/lib/products/own-product-detail-tabs.ts'),
      read('src/lib/layout/breadcrumbs.ts'),
    ]);

    assert.match(nested, /parseOwnProductPharmaciesSegments/);
    assert.match(fallback, /parseOwnProductPharmaciesSegments/);
    assert.match(scope, /parseOwnProductPharmaciesSegments/);
    assert.match(tabs, /segment === 'pharmacies'/);
    assert.match(breadcrumbs, /tab === 'pharmacies'/);
  });
}

//===================================================================

{
  // Originally covered in owner-product-pharmacies-stage-14-18-137.contract.test.ts.
  const read = (path: string) => readFile(resolve(process.cwd(), path), 'utf8');

  const prefix = 'src/components/products/OwnProductDetailsPageContent/';

  test('Pharmacy status remains available as a filter, without any statistics block', async () => {
    const [tab, drawer, css] = await Promise.all([
      read(prefix + 'OwnProductPharmaciesTab.tsx'),
      read(prefix + 'OwnProductPharmaciesFiltersDrawer.tsx'),
      read(prefix + 'OwnProductPharmaciesTab.module.css'),
    ]);

    assert.doesNotMatch(
      tab,
      /getOwnedPharmacyStatistics|OwnProductPharmaciesStatistics|statisticsCard/
    );

    assert.doesNotMatch(css, /\.statisticsCard|\.activeCard/);
    assert.match(drawer, /label="Pharmacy status"/);
    assert.match(drawer, /PHARMACY_STATUS_PRESENTATION/);
  });

  test('pharmacy search includes complete owner registry and region/settlement are available', async () => {
    const [tab, drawer] = await Promise.all([
      read(prefix + 'OwnProductPharmaciesTab.tsx'),
      read(prefix + 'OwnProductPharmaciesFiltersDrawer.tsx'),
    ]);

    assert.match(tab, /registryReady \? registry\?\.items \?\? \[\] : \[\]/);
    assert.match(tab, /getOwnedPharmacyLocationFilterOptions/);
    assert.match(drawer, /label="Product availability"/);
    assert.match(drawer, /label="Region"/);
    assert.match(drawer, /label="Settlement"/);
    assert.match(drawer, /disabled=\{!state\.region\}/);
  });

  test('pharmacy table removes action and sale availability, and has narrow ID column', async () => {
    const [table, css] = await Promise.all([
      read(prefix + 'OwnProductPharmaciesTable.tsx'),
      read(prefix + 'OwnProductPharmaciesTab.module.css'),
    ]);

    const keys = [...table.matchAll(/key: '([^']+)'/g)].map(
      (match) => match[1]
    );

    assert.deepEqual(keys, [
      'date',
      'photo',
      'id',
      'name',
      'price',
      'updated',
      'inStock',
      'reserved',
      'available',
      'status',
    ]);

    assert.match(table, /width: '116px'/);
    assert.match(css, /\.pharmacyIdLink[\s\S]*max-width: 116px/);
  });
}

//===================================================================

// Reuse the same native SelectField behavior as the working registry drawer.
// No stage-specific z-index, positioning, or portals for these options.
test('product pharmacy dropdowns use the same unmodified SelectField as Pharmacy status', async () => {
  const [productDrawer, registryDrawer, css] = await Promise.all([
    readFile(
      resolve(
        process.cwd(),
        'src/components/products/OwnProductDetailsPageContent/OwnProductPharmaciesFiltersDrawer.tsx'
      ),
      'utf8'
    ),

    readFile(
      resolve(
        process.cwd(),
        'src/components/pharmacies/OwnedPharmaciesFiltersDrawer/OwnedPharmaciesFiltersDrawer.tsx'
      ),
      'utf8'
    ),

    readFile(
      resolve(
        process.cwd(),
        'src/components/products/OwnProductDetailsPageContent/OwnProductPharmaciesTab.module.css'
      ),
      'utf8'
    ),
  ]);

  for (const field of ['status', 'availability', 'region', 'settlement']) {
    const start = productDrawer.indexOf(`id="product-pharmacy-${field}"`);

    assert.notEqual(start, -1, `${field} is present`);

    const end = productDrawer.indexOf('options={', start);
    const tag = productDrawer.slice(start, end);

    assert.doesNotMatch(
      tag,
      /className=|escapeOverflow/,
      `${field} must not customize dropdown stacking`
    );
  }

  assert.match(registryDrawer, /id="pharmacies-filter-region"/);

  assert.equal(
    (productDrawer.match(/escapeOverflow/g) ?? []).length,
    1,
    'Only the existing help tooltip can escape the drawer'
  );

  assert.doesNotMatch(css, /\.filterSelect|:has\(\[aria-expanded/);
});
