import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

//===================================================================

const read = (relativePath: string) =>
  readFile(resolve(process.cwd(), relativePath), 'utf8');

//===================================================================

const ownFolder = 'src/components/products/OwnProductDetailsPageContent/';

const globalCard =
  'src/components/all-products/AllProductDetailsPageContent/AllProductDetailsPageContent.tsx';

//===================================================================

// Architecture is intentionally feature-owned: no universal all/own mode, no proxy page wrapper.
test('global catalog and own product have independent page shells and tab implementations', async () => {
  const [global, own] = await Promise.all([
    read(globalCard),
    read(ownFolder + 'OwnProductDetailsPageContent.tsx'),
  ]);

  assert.doesNotMatch(global, /mode === 'own'|ProductDetailsMode|<OwnProduct/);

  assert.doesNotMatch(
    own,
    /AllProductDetailsPageContent|mode="own"|<OwnerAddProductConfirmation/
  );

  assert.match(global, /getOwnerCatalogProductReviews/);
  assert.match(own, /getOwnProductDetailTabPath\(productId, tab\)/);

  for (const file of [
    'OwnProductDetailsTab',
    'OwnProductStatisticsTab',
    'OwnProductRelatedOrdersTab',
    'OwnProductStockMovementTab',
    'OwnProductClientsTab',
    'OwnProductPharmaciesTab',
    'OwnProductCommentsTab',
    'OwnProductTabHeading',
  ]) {
    const source = await read(ownFolder + `${file}.tsx`);

    assert.match(own, new RegExp(`(?:import|<)\\s*\\{?\\s*${file}\\b`));
    assert.ok(source.length > 100, `${file} should contain real feature code`);
  }
});

//===================================================================

test('own operational fetches belong to their respective tabs and run with abort protection', async () => {
  const [own, stock, orders, clients, sales] = await Promise.all([
    read(ownFolder + 'OwnProductDetailsPageContent.tsx'),
    read(ownFolder + 'OwnProductStockMovementTab.tsx'),
    read(ownFolder + 'OwnProductRelatedOrdersTab.tsx'),
    read(ownFolder + 'OwnProductClientsTab.tsx'),
    read(ownFolder + 'OwnProductStatisticsTab.tsx'),
  ]);

  assert.doesNotMatch(
    own,
    /getPharmacyOrders\(|getProductStockMovements\(|getPharmacyClients\(|getPharmacyOrderSalesStatistics\(/
  );

  for (const [source, method] of [
    [stock, 'getProductStockMovements'],
    [orders, 'getPharmacyOrders'],
    [clients, 'getPharmacyClients'],
    [sales, 'getPharmacyOrderSalesStatistics'],
  ] as const) {
    assert.ok(
      source.includes(`${method}(`),
      `${method} must be loaded by its tab`
    );

    assert.match(source, /controller\.abort\(\)/);
  }

  assert.match(orders, /scope: 'owner' as const/);
  assert.match(sales, /scope: 'owner'/);
});

//===================================================================

test('separate detail CSS modules and responsive owner actions remain available', async () => {
  const [global, owner, details] = await Promise.all([
    read(
      'src/components/all-products/AllProductDetailsPageContent/AllProductDetailsPageContent.module.css'
    ),

    read(ownFolder + 'OwnProductDetailsPageContent.module.css'),
    read(ownFolder + 'OwnProductDetailsTab.tsx'),
  ]);

  assert.match(global, /\.addedProductNotice/);
  assert.doesNotMatch(owner, /\.addedProductNotice/);
  assert.match(owner, /\.actions\.ownProductActions/);
  assert.match(details, /Open global product/);
  assert.match(details, /Remove from my pharmacy/);
  assert.doesNotMatch(details, /getProductPriceLabel|Product sales analytics/);
});

//===================================================================

test('product-specific canonical routes use the correct card without mode props', async () => {
  for (const route of [
    'src/app/pharmacy/all-products/[productId]/page.tsx',
    'src/app/pharmacy/all-products/[productId]/[tab]/page.tsx',
    'src/app/pharmacy/all-products/[[...filters]]/page.tsx',
  ]) {
    const source = await read(route);

    assert.match(
      source,
      /<AllProductDetailsPageContent productId=\{productId\}/
    );

    assert.doesNotMatch(source, /mode="all"/);
  }

  const own = await read(
    'src/app/pharmacy/products/[productId]/[tab]/page.tsx'
  );

  assert.match(own, /<OwnProductDetailsPageContent productId=\{productId\}/);
  assert.match(own, /isOwnProductDetailTab\(tab\)/);
});
