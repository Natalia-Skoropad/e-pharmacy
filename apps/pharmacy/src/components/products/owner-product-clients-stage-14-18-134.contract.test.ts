import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

//===================================================================

const read = (path: string) => readFile(resolve(process.cwd(), path), 'utf8');

//===================================================================

const own = 'src/components/products/OwnProductDetailsPageContent/';

//===================================================================

test('product clients are loaded independently with owner/product/pharmacy scoped filters', async () => {
  const [tab, page, search, table] = await Promise.all([
    read(own + 'OwnProductClientsTab.tsx'),
    read(own + 'OwnProductDetailsPageContent.tsx'),
    read('src/components/clients/OwnerClientSearch/OwnerClientSearch.tsx'),
    read('src/components/clients/ClientsTable/ClientsTable.tsx'),
  ]);

  assert.match(
    page,
    /activeTab === 'clients' \? \([\s\S]*<OwnProductClientsTab/
  );

  assert.match(tab, /scope: 'owner'/);
  assert.match(tab, /productId,/);
  assert.match(tab, /pharmacyId: route\.pharmacyId \|\| undefined/);
  assert.match(tab, /<OwnedPharmacySearch/);
  assert.match(tab, /<StatsLoadingSkeleton/);
  assert.match(tab, /<OwnerClientSearch/);
  assert.match(tab, /<ClientsTable[\s\S]*showProductQuantity/);
  assert.match(tab, /<RowsPerPageSelect/);
  assert.match(tab, /<PaginationView/);
  assert.match(tab, /includeSuccessfulOrders=\{false\}/);
  assert.match(search, /perPage: productId \? 50 : SEARCH_LIMIT/);
  assert.match(search, /hasMoreOptions=\{Boolean\(productId/);
  assert.match(table, /showProductQuantity \? /);
  assert.match(table, /client\.productQuantity \?\? 0/);
});

//===================================================================

test('the server counts unique successful product orders, item quantities, and item revenue', async () => {
  const [aggregation, apiTypes, browser] = await Promise.all([
    read('../api/src/services/clients/client-registry-aggregation.ts'),
    read('../api/src/services/clients/client-types.ts'),
    read('src/lib/clients/clients.ts'),
  ]);

  assert.match(aggregation, /status: 'successful',[\s\S]*'items\.productId'/);
  assert.match(aggregation, /matchingProductItems:[\s\S]*\$filter/);
  assert.match(aggregation, /matchingProductItems'[\s\S]*\$\$item\.totalPrice/);
  assert.match(aggregation, /productQuantity:[\s\S]*\$\$item\.quantity/);
  assert.match(aggregation, /_id: '\$userId'/);
  assert.match(apiTypes, /productQuantity\?: number/);
  assert.match(browser, /rawClient\.productQuantity/);
});

//===================================================================

test('client-specific URL routes preserve owner scope, canonical ordering and valid tabs', async () => {
  const [paths, route, scope, tabs, fallback] = await Promise.all([
    read('src/lib/products/own-product-clients-paths.ts'),
    read('src/app/pharmacy/products/[productId]/[tab]/[...filters]/page.tsx'),
    read('src/lib/pharmacies/selected-pharmacy-scope.ts'),
    read('src/lib/products/own-product-detail-tabs.ts'),
    read('src/app/pharmacy/products/[[...filters]]/page.tsx'),
  ]);

  assert.match(paths, /segments\.push\(`pharmacy-id-/);
  assert.match(paths, /segments\.push\(`client-id-/);
  assert.match(paths, /segments\.push\(`status-/);
  assert.match(paths, /segments\.push\(`date-from-/);
  assert.match(paths, /segments\.push\(`per-page-/);
  assert.match(paths, /segments\.push\(`page-/);
  assert.match(route, /tab === 'clients'/);
  assert.match(scope, /parseOwnProductClientsSegments/);
  assert.match(tabs, /segment === 'clients'/);
  assert.match(fallback, /parseOwnProductClientsSegments/);
});
