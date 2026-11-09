import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

//===================================================================

const read = (path: string) => readFile(resolve(process.cwd(), path), 'utf8');

//===================================================================

const own = 'src/components/products/OwnProductDetailsPageContent/';

//===================================================================

test('Statistics has shared pharmacy selector, independent scoped sales chart, and in-chart feedback', async () => {
  const [statistics, page] = await Promise.all([
    read(own + 'OwnProductStatisticsTab.tsx'),
    read(own + 'OwnProductDetailsPageContent.tsx'),
  ]);

  assert.match(statistics, /<OwnedPharmacySearch/);
  assert.match(statistics, /label="Select pharmacy"/);
  assert.match(statistics, /pharmacyId: pharmacyId \|\| undefined/);
  assert.match(statistics, /scope: 'owner'/);
  assert.match(statistics, /<SalesValueChart/);
  assert.match(statistics, /headerContent=\{/);
  assert.match(statistics, /contentState=\{contentState\}/);
  assert.match(statistics, /onRetry=\{\(\) => setRetry/);
  assert.doesNotMatch(statistics, /<OwnProductStatistics/);
  assert.match(page, /activeTab === 'statistics' \? \(/);
  assert.match(page, /<OwnProductStatisticsTab productId=\{productId\}/);
});

//===================================================================

test('Stock movement shows owner-scoped pharmacy chooser, local stock cards, and no all-pharmacies table', async () => {
  const stock = await read(own + 'OwnProductStockMovementTab.tsx');

  assert.match(stock, /<OwnedPharmacySearch/);
  assert.match(stock, /!hasSelectedPharmacy \? \(/);
  assert.match(stock, /Select a pharmacy to view stock movement/);

  assert.match(
    stock,
    /<OwnProductStatistics counts=\{getPharmacyStockCounts\(currentOffer\)\}/
  );

  assert.match(
    stock,
    /getProductStockMovements\(\s*productId,\s*\{ signal: controller\.signal \},\s*pharmacyId\s*\)/
  );

  assert.match(stock, /currentStockStatus === 'error'/);
  assert.match(stock, /<DataTable/);
  assert.match(stock, /controller\.abort\(\)/);
});

//===================================================================

test('Owner sales and stock backend authorize selected pharmacy IDs', async () => {
  const [
    salesSchema,
    salesService,
    productSchema,
    productService,
    route,
    browser,
  ] = await Promise.all([
    read('../api/src/schemas/orders/order.schema.ts'),
    read('../api/src/services/orders/order-sales-statistics.service.ts'),
    read('../api/src/schemas/catalog/product.schema.ts'),
    read('../api/src/services/inventory/stock-movement-read.service.ts'),
    read('../api/src/routes/catalog/product.routes.ts'),
    read('src/lib/api/browser/products.api.ts'),
  ]);

  assert.match(salesSchema, /pharmacyId: mongoIdSchema\.optional\(\)/);
  assert.match(salesService, /!pharmacyIds\.includes\(query\.pharmacyId\)/);

  assert.match(
    salesService,
    /query\.pharmacyId \? \[query\.pharmacyId\] : pharmacyIds/
  );

  assert.match(productSchema, /productStockMovementsQuerySchema/);

  assert.match(
    productService,
    /requirePharmacyCapability\(userId, 'read_stock'/
  );

  assert.match(
    productService,
    /\.\.\.\(pharmacyId \? \{ pharmacyId \} : \{\}\)/
  );

  assert.match(route, /query: productStockMovementsQuerySchema/);
  assert.match(browser, /pharmacyId \? ownerLocalApiRequest : localApiRequest/);
});

//===================================================================

test('Page-header help cards have per-item icons', async () => {
  const [clients, products] = await Promise.all([
    read('src/components/clients/ClientsPageContent/ClientsPageContent.tsx'),

    read(
      'src/components/products/OwnProductsPageContent/OwnerOwnProductsPageContent.tsx'
    ),
  ]);

  assert.match(clients, /title: 'Repeat clients',[\s\S]{0,90}icon: <Repeat2/);
  assert.match(clients, /title: 'Walk-in client',[\s\S]{0,90}icon: <Store/);

  assert.match(
    products,
    /title: 'Reserved products',[\s\S]{0,90}icon: <ShoppingBag/
  );

  assert.match(
    products,
    /title: 'Available products',[\s\S]{0,90}icon: <Archive/
  );
});
