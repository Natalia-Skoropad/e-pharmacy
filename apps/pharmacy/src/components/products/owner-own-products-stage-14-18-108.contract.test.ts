import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

//===================================================================

const read = (file: string) => readFile(resolve(process.cwd(), file), 'utf8');

//===================================================================

test('owner products uses a separate authenticated owner inventory read', async () => {
  const [page, adapter, boundary] = await Promise.all([
    read(
      'src/components/products/OwnProductsPageContent/OwnerOwnProductsPageContent.tsx'
    ),

    read('src/lib/api/browser/owner-own-products.api.ts'),
    read('src/components/layout/PharmacyShell/PharmacyCabinetBoundary.tsx'),
  ]);

  assert.match(page, /getOwnerOwnProducts\(queryParams/);
  assert.match(adapter, /ownerProducts: true/);
  assert.match(adapter, /localApiRequest\(path/);
  assert.match(boundary, /isOwnerProductsListPath\(pathname\)/);
});

//===================================================================

test('all pharmacies and individual pharmacy share one searchable registry', async () => {
  const [page, pharmacySearch] = await Promise.all([
    read(
      'src/components/products/OwnProductsPageContent/OwnerOwnProductsPageContent.tsx'
    ),

    read(
      'src/components/pharmacies/OwnedPharmacySearch/OwnedPharmacySearch.tsx'
    ),
  ]);

  assert.match(page, /<OwnedPharmacySearch/);
  assert.match(page, /label="Select pharmacy"/);
  assert.match(page, /explainStatistics/);
  assert.match(pharmacySearch, /All pharmacies/);
  assert.match(pharmacySearch, /Statistics and products/);
});

//===================================================================

test('product search progressively loads only inventory products', async () => {
  const [page, picker] = await Promise.all([
    read(
      'src/components/products/OwnProductsPageContent/OwnerOwnProductsPageContent.tsx'
    ),

    read(
      'src/components/all-products/OwnerProductSearch/OwnerProductSearch.tsx'
    ),
  ]);

  assert.match(page, /loadProducts=\{getOwnerOwnProductSuggestions\}/);
  assert.match(picker, /hasMoreOptions=/);
  assert.match(picker, /loadMoreError=/);
  assert.match(picker, /loadingMessage="Loading products/);
});

//===================================================================

test('table uses individual category icons and owner average price for all pharmacies', async () => {
  const [page, table, parser] = await Promise.all([
    read(
      'src/components/products/OwnProductsPageContent/OwnerOwnProductsPageContent.tsx'
    ),

    read('src/components/products/OwnProductsTable/OwnProductsTable.tsx'),
    read('src/lib/products/products.ts'),
  ]);

  assert.match(page, /getProductCategories/);
  assert.match(table, /CategoryIcon name=\{category.icon\}/);
  assert.match(table, /TableHeaderTitle parts=\{\['Average', 'price, ₴'\]\}/);
  assert.match(table, /isAllPharmacies \|\|/);
  assert.match(parser, /projectOwnerProduct/);

  assert.match(
    parser,
    /rows\.reduce\(\(total, row\) => total \+ row\.currentPrice/
  );
});

//===================================================================

test('filters, statistics, and pagination use the existing UI patterns', async () => {
  const [page, drawer, statistic] = await Promise.all([
    read(
      'src/components/products/OwnProductsPageContent/OwnerOwnProductsPageContent.tsx'
    ),

    read(
      'src/components/products/OwnProductsFiltersDrawer/OwnProductsFiltersDrawer.tsx'
    ),

    read(
      'src/components/statistics/OwnProductStatistics/OwnProductStatistics.tsx'
    ),
  ]);

  assert.match(page, /StatsLoadingSkeleton/);
  assert.match(page, /ProfileResourceState/);
  assert.match(page, /fullWidthOnMobile/);
  assert.match(page, /buildOwnProductsPath/);
  assert.match(page, /PaginationView/);
  assert.match(drawer, /CategoryIcon/);
  assert.match(drawer, /StatusBadge/);
  assert.match(drawer, /STOCK_ICONS/);
  assert.match(statistic, /activeKeys/);
});

//===================================================================

test('pharmacy detail keeps its embedded own products component alongside the owner-wide registry', async () => {
  const [barrel, embedded, pharmacyDetail, ownerRegistry] = await Promise.all([
    read('src/components/products/OwnProductsPageContent/index.ts'),

    read(
      'src/components/products/OwnProductsPageContent/OwnProductsPageContent.tsx'
    ),

    read(
      'src/components/pharmacies/OwnedPharmacyDetailPageContent/OwnedPharmacyDetailPageContent.tsx'
    ),

    read(
      'src/components/products/OwnProductsPageContent/OwnerOwnProductsPageContent.tsx'
    ),
  ]);

  assert.match(barrel, /from '\.\/OwnProductsPageContent'/);
  assert.match(embedded, /export \{ OwnProductsPageContent \}/);
  assert.match(embedded, /embedded\s*\|\|\s*debouncedFilters\s*!==\s*filters/);
  assert.match(embedded, /productId:\s*filters\.productId/);
  assert.match(embedded, /pharmacyId:\s*filters\.pharmacyId/);

  assert.match(
    pharmacyDetail,
    /<OwnerOwnProductsPageContent[\s\S]*?embeddedPharmacyId/
  );

  assert.match(pharmacyDetail, /minWidth=\{960\}/);
  assert.match(ownerRegistry, /export \{ OwnerOwnProductsPageContent \}/);

  // The detail page's width is forwarded only to its embedded table.
  assert.match(ownerRegistry, /minWidth\?: number/);

  assert.match(
    ownerRegistry,
    /minWidth=\{embeddedPharmacyId \? \(minWidth \?\? 960\) : undefined\}/
  );

  assert.match(
    ownerRegistry,
    /setAvailableAddedDates\(response\.availableAddedDates/
  );

  assert.match(ownerRegistry, /availableDates=\{availableAddedDates\}/);
});
