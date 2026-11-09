import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

//===================================================================

const read = (path: string) => readFile(resolve(process.cwd(), path), 'utf8');

//===================================================================

const owner = 'src/components/products/OwnProductDetailsPageContent/';

const globalCard =
  'src/components/all-products/AllProductDetailsPageContent/AllProductDetailsPageContent.tsx';

//===================================================================

test('initial product loading fetches only owner catalog details; ancillary requests live in their own tabs', async () => {
  const [global, own, related, stock, clients, statistics, reviews] =
    await Promise.all([
      read(globalCard),
      read(owner + 'OwnProductDetailsPageContent.tsx'),
      read(owner + 'OwnProductRelatedOrdersTab.tsx'),
      read(owner + 'OwnProductStockMovementTab.tsx'),
      read(owner + 'OwnProductClientsTab.tsx'),
      read(owner + 'OwnProductStatisticsTab.tsx'),
      read(globalCard),
    ]);

  for (const root of [own, global]) {
    assert.match(root, /getOwnerCatalogProductDetails\(productId/);
    assert.doesNotMatch(
      root,
      /getPharmacyOrders\(|getPharmacyClients\(|getProductStockMovements\(|getPharmacyOrderSalesStatistics\(/
    );
  }

  assert.match(related, /getPharmacyOrders\(/);
  assert.match(stock, /getProductStockMovements\(/);
  assert.match(clients, /getPharmacyClients\(/);
  assert.match(statistics, /getPharmacyOrderSalesStatistics\(/);
  assert.match(reviews, /getOwnerCatalogProductReviews\(/);
});

//===================================================================

test('related orders retain server pagination and owner scope', async () => {
  const source = await read(owner + 'OwnProductRelatedOrdersTab.tsx');

  assert.match(source, /page: relatedCurrentPage/);
  assert.match(source, /perPage: relatedRowsPerPage/);
  assert.match(source, /scope: 'owner'/);
  assert.match(source, /setRelatedOrdersTotal\(response\.total\)/);
  assert.match(source, /items=\{relatedOrderRows\}/);
  assert.doesNotMatch(source, /perPage:\s*200|paginatedRelatedOrderRows/);
});

//===================================================================

test('stock movement uses explicitly selected owned pharmacy and local retry/loading states', async () => {
  const source = await read(owner + 'OwnProductStockMovementTab.tsx');

  assert.match(source, /if \(!pharmacyId \|\| !currentOffer\) return/);
  assert.match(source, /Select a specific pharmacy to view its product stock/);
  assert.match(source, /Stock movement could not be loaded/);
  assert.match(source, /currentStockStatus !== 'success'/);
  assert.doesNotMatch(source, /getActiveOrdersReservedQuantity/);
});

//===================================================================

test('supporting resources show independent unavailable/loading states and abort stale loads', async () => {
  for (const filename of [
    'OwnProductRelatedOrdersTab.tsx',
    'OwnProductStockMovementTab.tsx',
    'OwnProductClientsTab.tsx',
    'OwnProductStatisticsTab.tsx',
  ]) {
    const source = await read(owner + filename);

    assert.match(source, /AbortController/);
    assert.match(source, /controller\.abort\(\)/);
  }

  const global = await read(globalCard);

  assert.match(global, /Reviews are temporarily unavailable/);
  assert.match(global, /setStatus\('error'\)/);
});

//===================================================================

test('global addition and owner removal preserve safe server error handling and mutation reconciliation', async () => {
  const [global, own] = await Promise.all([
    read(globalCard),
    read(owner + 'OwnProductDetailsPageContent.tsx'),
  ]);

  assert.match(global, /addOwnerCatalogProduct\(product\.id\)/);

  assert.match(
    global,
    /setProduct\(\{ \.\.\.response\.product, isAddedToOwner: true \}\)/
  );

  assert.match(own, /removeProductFromMyPharmacy\(product\.id\)/);
  assert.match(own, /shouldReconcileRemove\(removeError\)/);
  assert.match(own, /getOwnerCatalogProductDetails\(product\.id\)/);

  for (const source of [global, own])
    assert.match(source, /getSafeApiErrorMessage/);
});
