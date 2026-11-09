import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

//===================================================================

const read = (path: string) =>
  readFile(resolve(process.cwd(), 'src', path), 'utf8');

//===================================================================

test('global catalog exposes exactly three informational tabs and no operational tabs', async () => {
  const [tabs, card, route] = await Promise.all([
    read('lib/products/all-product-detail-tabs.ts'),

    read(
      'components/all-products/AllProductDetailsPageContent/AllProductDetailsPageContent.tsx'
    ),

    read('app/pharmacy/all-products/[productId]/[tab]/page.tsx'),
  ]);

  const list = tabs.slice(
    tabs.indexOf('export const ALL_PRODUCT_DETAIL_TABS'),
    tabs.indexOf('] as const;')
  );

  assert.deepEqual(
    [...list.matchAll(/'([a-z-]+)'/g)].map((item) => item[1]),
    ['details', 'characteristics', 'reviews']
  );

  assert.match(card, /getAllProductDetailTabPath/);

  assert.doesNotMatch(
    card,
    /relatedOrdersStatus|stockMovementRows|OwnProductStatisticsTab|OwnProductClientsTab/
  );

  assert.match(route, /!isAllProductDetailTab\(tab\)\) notFound\(\)/);
});

//===================================================================

test('already selected or blocked catalog product links to owner card without product price', async () => {
  const card = await read(
    'components/all-products/AllProductDetailsPageContent/AllProductDetailsPageContent.tsx'
  );

  assert.match(card, /This product has already been added to your pharmacies/);
  assert.match(card, /getPharmacyProductPath\(product\.id\)/);
  assert.match(card, /!isAdded \? <div className=\{css\.ownerActions\}>/);
  assert.match(card, /product\.status === 'blocked' \? 'Unavailable'/);
  assert.doesNotMatch(card, /Request another product|GetProductPriceLabel/);
});

//===================================================================

test('operational tables link to the owner card and the global catalog table stays in catalog', async () => {
  const [ownTable, purchased, requests, allTable] = await Promise.all([
    read('components/products/OwnProductsTable/OwnProductsTable.tsx'),

    read(
      'components/clients/ClientDetailsPageContent/ClientDetailTableColumns.tsx'
    ),

    read(
      'components/product-requests/ProductRequestsTable/ProductRequestsTable.tsx'
    ),

    read('components/all-products/AllProductsTable/AllProductsTable.tsx'),
  ]);

  for (const source of [ownTable, purchased, requests]) {
    assert.match(source, /getPharmacyProductPath\(/);
    assert.doesNotMatch(source, /getPharmacyAllProductPath/);
  }

  assert.match(allTable, /getPharmacyAllProductPath\(/);
});

//===================================================================

test('own product card is owner scoped and accessible without choosing a pharmacy', async () => {
  const [own, scope, boundary] = await Promise.all([
    read(
      'components/products/OwnProductDetailsPageContent/OwnProductDetailsPageContent.tsx'
    ),

    read('lib/pharmacies/selected-pharmacy-scope.ts'),
    read('components/layout/PharmacyShell/PharmacyCabinetBoundary.tsx'),
  ]);

  assert.match(own, /!response\.product\.isAddedToOwner/);
  assert.match(own, /getOwnerCatalogProductDetails\(productId/);
  assert.match(own, /activeTab === 'statistics'/);
  assert.match(own, /activeTab === 'pharmacies'/);
  assert.match(scope, /export function isOwnerProductDetailPath/);
  assert.match(scope, /!isOwnerProductDetailPath\(pathname\)/);
  assert.match(boundary, /isOwnerProductDetailPath\(pathname\)/);
});
