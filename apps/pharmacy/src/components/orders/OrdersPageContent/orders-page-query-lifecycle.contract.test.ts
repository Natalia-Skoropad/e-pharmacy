import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

//===================================================================

const componentPath = path.resolve(
  process.cwd(),
  'src/components/orders/OrdersPageContent/OrdersPageContent.tsx'
);

//===================================================================

test('Orders registry derives selected pharmacy, filters and pagination from route state', async () => {
  const source = await readFile(componentPath, 'utf8');

  assert.match(source, /parseOrdersSegments\(\{ filters: segments \}\)/);

  assert.match(
    source,
    /parseOrdersPaginationSegments\(\{ filters: segments \}\)/
  );

  assert.match(source, /buildOrdersPath\(nextFilters/);

  assert.match(
    source,
    /buildEmbeddedOrdersPath\(embeddedPharmacyId, nextFilters, pagination\)/
  );

  assert.match(source, /pathname\.startsWith/);
  assert.match(source, /scope: embedded \? undefined : 'owner'/);
  assert.match(source, /embeddedReady/);
  assert.match(source, /embeddedPharmacyId/);
  assert.match(source, /pharmacyId: filters\.pharmacyId \|\| undefined/);

  assert.match(
    source,
    /clientId: embeddedClientId \|\| filters.clientId \|\| undefined/
  );

  assert.match(source, /orderId: filters.orderId \|\| undefined/);
  assert.doesNotMatch(source, /useDebouncedValue/);
});

//===================================================================

test('Orders page accepts the canonical backend page through a URL replacement', async () => {
  const source = await readFile(componentPath, 'utf8');

  assert.match(source, /result.page !== params.page/);
  assert.match(source, /router\.replace\(canonical, \{ scroll: false \}\)/);

  assert.match(
    source,
    /buildEmbeddedOrdersPath\(embeddedPharmacyId, filters, \{\s*page: result.page,\s*perPage,\s*\}\)/
  );

  assert.doesNotMatch(source, /setCurrentPage\(response.page\)/);
});

//===================================================================

test('Orders page has independent scoped selectors, statistics and loading states', async () => {
  const source = await readFile(componentPath, 'utf8');

  assert.match(source, /<OwnedPharmacySearch/);
  assert.match(source, /statisticsContext="orders"/);
  assert.match(source, /<OrderScopeSearch[\s\S]*?kind="client"/);
  assert.match(source, /<OrderScopeSearch[\s\S]*?kind="order"/);
  assert.match(source, /<StatsLoadingSkeleton/);
  assert.match(source, /<ProfileResourceState/);
  assert.match(source, /fullWidthOnMobile/);
});

//===================================================================

// Embedded Orders keeps its local URL and does not display a selection-level loader.
test('embedded Orders preserves the detail URL and uses only content loaders', async () => {
  const source = await readFile(componentPath, 'utf8');

  const detail = await readFile(
    path.resolve(
      process.cwd(),
      'src/components/pharmacies/OwnedPharmacyDetailPageContent/OwnedPharmacyDetailPageContent.tsx'
    ),
    'utf8'
  );

  assert.match(source, /buildEmbeddedOrdersPath\(embeddedPharmacyId, next/);
  assert.match(source, /buildEmbeddedOrdersPath\(embeddedPharmacyId, filters/);
  assert.match(source, /embedded && !embeddedReady/);
  assert.doesNotMatch(detail, /Selecting pharmacy/);
  assert.match(detail, /visibleTab !== 'comments' && visibleTab !== 'orders'/);
  assert.match(detail, /: visibleTab === 'orders' \? \(/);
  assert.doesNotMatch(detail, /pharmacy && visibleTab === 'orders'/);

  assert.match(
    detail,
    /embeddedReady=\{!selectionLoading && selectedId === pharmacyId\}/
  );
});

//===================================================================

// Shared Orders registry is also used on a specific product, without making
// filters global or changing the owner-scoped access boundary.
test('related product Orders scopes table, statistics and search options by product and keeps its route', async () => {
  const source = await readFile(componentPath, 'utf8');

  const table = await readFile(
    path.resolve(
      process.cwd(),
      'src/components/orders/OrdersTable/OrdersTable.tsx'
    ),
    'utf8'
  );

  const search = await readFile(
    path.resolve(
      process.cwd(),
      'src/components/orders/OrderScopeSearch/OrderScopeSearch.tsx'
    ),
    'utf8'
  );

  const detail = await readFile(
    path.resolve(
      process.cwd(),
      'src/components/products/OwnProductDetailsPageContent/OwnProductDetailsPageContent.tsx'
    ),
    'utf8'
  );

  const client = await readFile(
    path.resolve(
      process.cwd(),
      'src/components/clients/ClientDetailsPageContent/ClientDetailsPageContent.tsx'
    ),
    'utf8'
  );

  assert.match(source, /productId: relatedProductId \|\| undefined/);

  assert.match(
    source,
    /buildRelatedProductOrdersPath\(relatedProductId, nextFilters, pagination\)/
  );

  assert.match(source, /productId=\{relatedProductId\}/);
  assert.match(table, /key: 'pharmacy'/);

  assert.match(
    table,
    /order\.items\.find\(\(item\) => item\.productId === productId\)/
  );

  assert.match(search, /productId: productId \|\| undefined/);
  assert.match(detail, /activeTab === 'related-orders' && !error/);
  assert.match(client, /<OrdersPageContent embeddedClientId=\{clientId\}/);

  const drawer = await readFile(
    path.resolve(
      process.cwd(),
      'src/components/orders/OrdersFiltersDrawer/OrdersFiltersDrawer.tsx'
    ),
    'utf8'
  );

  assert.match(source, /id="related-orders-pharmacy-search"/);
  assert.match(source, /relatedProduct=\{Boolean\(relatedProductId\)\}/);
  assert.match(source, /filters\.pharmacyId \? \(/);
  assert.match(table, /allColumns\.filter/);
  assert.match(drawer, /!relatedProduct/);
});

//===================================================================

test('product related orders renders a scoped selector, trimmed filters, columns and creation control', async () => {
  const source = await readFile(componentPath, 'utf8');

  const drawer = await readFile(
    path.resolve(
      process.cwd(),
      'src/components/orders/OrdersFiltersDrawer/OrdersFiltersDrawer.tsx'
    ),
    'utf8'
  );

  const table = await readFile(
    path.resolve(
      process.cwd(),
      'src/components/orders/OrdersTable/OrdersTable.tsx'
    ),
    'utf8'
  );

  const detail = await readFile(
    path.resolve(
      process.cwd(),
      'src/components/orders/OrderDetailsPageContent/OrderDetailsPageContent.tsx'
    ),
    'utf8'
  );

  assert.match(source, /id="related-orders-pharmacy-search"/);
  assert.match(source, /relatedProduct=\{Boolean\(relatedProductId\)\}/);
  assert.match(source, /\{filters\.pharmacyId \? \(/);
  assert.match(drawer, /!relatedProduct/);
  assert.match(table, /allColumns\.filter/);
  assert.match(table, /'clientComment'/);

  assert.match(
    detail,
    /If you add this product again, the updated price will apply/
  );
});

//===================================================================

test('client Orders and new-order navigation stay explicitly scoped without a global pharmacy query', async () => {
  const source = await readFile(componentPath, 'utf8');

  assert.match(
    source,
    /buildClientOrdersPath\(embeddedClientId, nextFilters, pagination\)/
  );

  assert.match(source, /hideClient=\{Boolean\(embeddedClientId\)\}/);
  assert.match(source, /getPharmacyNewOrderPath\(filters\.pharmacyId\)/);
  assert.doesNotMatch(source, /orders\/new\?pharmacyId/);
});
