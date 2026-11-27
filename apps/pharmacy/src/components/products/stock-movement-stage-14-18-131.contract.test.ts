import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

//===================================================================

const read = (path: string) => readFile(resolve(process.cwd(), path), 'utf8');

//===================================================================

const base = 'src/components/products/OwnProductDetailsPageContent/';

//===================================================================

test('stock movement selectors use scoped orders rather than an unfiltered orders API', async () => {
  const [tab, select] = await Promise.all([
    read(`${base}OwnProductStockMovementTab.tsx`),
    read(`${base}StockMovementOrderSearch.tsx`),
  ]);

  assert.match(
    tab,
    /rows=\{\s*lastLoadedKey === stockKey\s*&&\s*currentStockStatus === 'success'\s*\?\s*allStockRows\s*:\s*\[\]\s*\}/
  );

  assert.match(select, /Map<string/);
  assert.match(select, /order\.comments/);
  assert.match(select, /pageSize=\{50\}/);
  assert.doesNotMatch(tab, /Order number search|Comment search/);
});

//===================================================================

test('stock movement supports pharmacy-first URL filters and independent resource states', async () => {
  const [route, tab, tabs, breadcrumbs] = await Promise.all([
    read('src/lib/products/stock-movement-paths.ts'),
    read(`${base}OwnProductStockMovementTab.tsx`),
    read('src/lib/products/own-product-detail-tabs.ts'),
    read('src/lib/layout/breadcrumbs.ts'),
  ]);

  assert.match(route, /pharmacy-id-\$\{value\.pharmacyId\}/);
  assert.match(route, /order-id-\$\{value\.orderId\}/);
  assert.match(route, /per-page-\$\{value\.perPage\}/);
  assert.match(route, /page-\$\{value\.page\}/);
  assert.match(route, /if \(!value\.pharmacyId && segments\.length > 0\)/);
  assert.match(tabs, /segment === 'stock-movement'/);
  assert.match(breadcrumbs, /tab === 'stock-movement'/);
  assert.match(tab, /stockStatisticsCard/);
  assert.match(tab, /<DataTable[\s\S]*isLoading=\{stockReadLoading\}/);
});

//===================================================================

test('chart filters provide conditional reset control and stock info is in its tab heading', async () => {
  const [toolbar, heading, stock] = await Promise.all([
    read('src/components/statistics/SalesChartFilterToolbar.tsx'),
    read(`${base}OwnProductTabHeading.tsx`),
    read(`${base}OwnProductStockMovementTab.tsx`),
  ]);

  assert.match(toolbar, /hasFilters \? \(/);
  assert.match(toolbar, /Reset filters/);
  assert.match(heading, /How stock movement works/);
  assert.match(heading, /Stock arrivals/);
  assert.doesNotMatch(stock, /How stock movement works/);
});

//===================================================================

test('rejected stock movement rows reuse the shared cancellation source badge', async () => {
  const [tab, helpers] = await Promise.all([
    read(`${base}OwnProductStockMovementTab.tsx`),
    read(`${base}own-product-detail-helpers.ts`),
  ]);

  assert.match(tab, /<OrderRejectionSourceBadge/);
  assert.match(tab, /rejectedByType=\{row\.rejectedByType\}/);

  assert.match(
    helpers,
    /movement\.orderStatus === 'rejected' && movement\.rejectedByType/
  );

  assert.match(helpers, /rejectedByType: movement\.rejectedByType/);
});

//===================================================================

test('products catch-all accepts filtered stock movement and related orders', async () => {
  const fallback = await read(
    'src/app/pharmacy/products/[[...filters]]/page.tsx'
  );

  assert.match(
    fallback,
    /tab === 'stock-movement' \|\| tab === 'related-orders'/
  );

  assert.match(
    fallback,
    /buildStockMovementPath\(productId, parseStockMovementSegments\(filters\)\)/
  );

  assert.match(fallback, /buildRelatedProductOrdersPath\(/);

  assert.match(
    fallback,
    /tab === 'related-orders' && !isOrdersFilterRoute\(filters\)/
  );
});

//===================================================================

test('stock movement counts remain visible and zero while current data loads', async () => {
  const tab = await read(`${base}OwnProductStockMovementTab.tsx`);

  assert.match(
    tab,
    /shown=\{\s*stockReadLoading \? 0 : paginatedStockMovementRows.length\s*\}/
  );

  assert.match(
    tab,
    /total=\{stockReadLoading \? 0 : stockMovementRows.length\}/
  );
});

//===================================================================

test('own and global product headers reserve the rating summary during loading', async () => {
  const own = await read(`${base}OwnProductDetailsPageContent.tsx`);

  const global = await read(
    'src/components/all-products/AllProductDetailsPageContent/AllProductDetailsPageContent.tsx'
  );

  for (const source of [own, global]) {
    assert.match(
      source,
      /product \|\| isLoading \? \([\s\S]*?<RatingSummary[\s\S]*?isLoading=\{isLoading\}/
    );
  }
});
