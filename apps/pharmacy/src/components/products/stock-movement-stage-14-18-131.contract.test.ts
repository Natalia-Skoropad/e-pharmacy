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
    /rows=\{lastLoadedKey === stockKey && currentStockStatus === 'success' \? allStockRows : \[\]\}/
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
