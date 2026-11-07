import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

//===================================================================

const source = (path: string) => readFile(resolve(process.cwd(), path), 'utf8');

//===================================================================

test('all products is account-wide, not a selected-pharmacy route', async () => {
  const [scope, provider, page] = await Promise.all([
    source('src/lib/pharmacies/selected-pharmacy-scope.ts'),

    source(
      'src/providers/PharmacySelectionProvider/PharmacySelectionProvider.tsx'
    ),

    source(
      'src/components/all-products/AllProductsPageContent/AllProductsPageContent.tsx'
    ),
  ]);

  assert.doesNotMatch(
    scope,
    /dashboard\|orders\|clients\|products\|all-products\|product-requests/
  );

  assert.match(provider, /pathname\.startsWith\('\/pharmacy\/all-products'\)/);
  assert.match(provider, /query\.delete\('pharmacyId'\)/);
  assert.match(page, /getOwnerCatalogProducts/);
  assert.match(page, /getOwnerCatalogStatistics/);
});

//===================================================================

test('Add button fails closed without Active or On moderation pharmacies', async () => {
  const page = await source(
    'src/components/all-products/AllProductsPageContent/AllProductsPageContent.tsx'
  );

  assert.match(page, /summary\.active \+ summary\.onModeration > 0/);

  assert.match(
    page,
    /isAddActionDisabled=\{isCheckingEligibility \|\| !hasEligiblePharmacy\}/
  );

  assert.match(page, /addOwnerCatalogProduct/);
});

//===================================================================

test('search, category icon from Admin, and product ID are surfaced', async () => {
  const [search, table, drawer] = await Promise.all([
    source(
      'src/components/all-products/OwnerProductSearch/OwnerProductSearch.tsx'
    ),

    source('src/components/all-products/AllProductsTable/AllProductsTable.tsx'),

    source(
      'src/components/all-products/AllProductsFiltersDrawer/AllProductsFiltersDrawer.tsx'
    ),
  ]);

  assert.match(search, /SearchableSelect/);
  assert.match(search, /Product search/);
  assert.match(search, /name or product ID/);
  assert.match(table, /key: 'productId'/);
  assert.doesNotMatch(table, /key: 'categoryColor'/);
  assert.match(table, /resolveOwnerCatalogCategory/);
  assert.match(table, /CategoryIcon/);
  assert.match(drawer, /StatusBadge/);
  assert.match(drawer, /CategoryIcon/);
});

//===================================================================

test('All products is not blocked by selected-pharmacy cabinet summary errors', async () => {
  const [boundary, shell] = await Promise.all([
    source('src/components/layout/PharmacyShell/PharmacyCabinetBoundary.tsx'),
    source('src/components/layout/PharmacyShell/PharmacyShell.tsx'),
  ]);

  assert.match(boundary, /pathname === PHARMACY_ROUTES\.ALL_PRODUCTS/);

  assert.match(
    boundary,
    /pathname\?\.startsWith\(`\$\{PHARMACY_ROUTES\.ALL_PRODUCTS\}\/`\)/
  );

  assert.match(boundary, /if \(!profile && error\)/);
  assert.match(shell, /<PharmacyCabinetBoundary>/);
});
