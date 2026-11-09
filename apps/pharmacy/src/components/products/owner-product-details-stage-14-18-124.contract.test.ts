import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

//===================================================================

const read = (path: string) => readFile(resolve(process.cwd(), path), 'utf8');

//===================================================================

const base = 'src/components/products/OwnProductDetailsPageContent/';

//===================================================================

test('own product tabs have approved order, icons and dedicated components', async () => {
  const [card, helper] = await Promise.all([
    read(base + 'OwnProductDetailsPageContent.tsx'),
    read('src/lib/products/own-product-detail-tabs.ts'),
  ]);

  const order = [
    'details',
    'statistics',
    'related-orders',
    'stock-movement',
    'clients',
    'pharmacies',
    'comments',
  ];

  const tabs = card.slice(
    card.indexOf('const PRODUCT_DETAILS_TABS:'),
    card.indexOf('function getProductError')
  );

  assert.deepEqual(
    [...tabs.matchAll(/value: '([^']+)'/g)].map((m) => m[1]),
    order
  );

  assert.deepEqual(
    [
      ...helper
        .slice(
          helper.indexOf('OWN_PRODUCT_DETAIL_TABS'),
          helper.indexOf('] as const')
        )
        .matchAll(/'([a-z-]+)'/g),
    ].map((m) => m[1]),
    order
  );

  assert.doesNotMatch(tabs, /value: 'characteristics'|value: 'reviews'/);
  assert.match(card, /<Boxes size=\{23\}/);

  for (const tab of [
    'Details',
    'Statistics',
    'RelatedOrders',
    'StockMovement',
    'Clients',
    'Pharmacies',
    'Comments',
  ]) {
    assert.match(card, new RegExp(`<OwnProduct${tab}Tab\\b`));
  }
});

//===================================================================

test('own product tab routes preserve owner scope, URL filters, and breadcrumbs', async () => {
  const [helper, route, crumbs, scope, boundary] = await Promise.all([
    read('src/lib/products/own-product-detail-tabs.ts'),
    read('src/app/pharmacy/products/[productId]/[tab]/page.tsx'),
    read('src/lib/layout/breadcrumbs.ts'),
    read('src/lib/pharmacies/selected-pharmacy-scope.ts'),
    read('src/components/layout/PharmacyShell/PharmacyCabinetBoundary.tsx'),
  ]);

  assert.match(helper, /tab === 'details' \? base : `\$\{base\}\/\$\{tab\}`/);
  assert.match(route, /isOwnProductsFilterRoute\(segments\)/);

  assert.match(
    route,
    /buildOwnProductsPath\(initialFilters, initialPagination\)/
  );

  assert.match(route, /isOwnProductDetailTab\(tab\)/);

  for (const tab of [
    'statistics',
    'related-orders',
    'stock-movement',
    'clients',
    'pharmacies',
    'comments',
  ]) {
    assert.ok(crumbs.includes(tab), `Breadcrumb missing ${tab}`);
    assert.ok(scope.includes(tab), `Owner scope missing ${tab}`);
  }

  assert.match(crumbs, /getPharmacyProductPath\(productId\)/);
  assert.match(boundary, /isOwnerProductDetailPath\(pathname\)/);
});

//===================================================================

test('Own Details matches catalog-style metadata, actions, and responsive behavior', async () => {
  const [details, css, owner, stats] = await Promise.all([
    read(base + 'OwnProductDetailsTab.tsx'),
    read(base + 'OwnProductDetailsPageContent.module.css'),
    read(base + 'OwnProductDetailsPageContent.tsx'),
    read(base + 'OwnProductStatisticsTab.tsx'),
  ]);

  assert.doesNotMatch(
    details,
    /getProductPriceLabel|Product sales analytics|Back to own products/
  );

  assert.match(details, /Open global product/);
  assert.match(details, /getPharmacyAllProductPath\(product\.id\)/);
  assert.match(details, /<Trash2 size=\{17\}/);

  const meta = details.slice(
    details.indexOf('<dl className={css.adminMetadata}>'),
    details.indexOf('</dl>')
  );

  assert.deepEqual(
    [...meta.matchAll(/<dt>([^<]+)<\/dt>/g)].map((m) => m[1]),
    [
      'Status',
      'Category',
      'Article',
      'Product ID',
      'Admin last update date',
      'Date added to pharmacy',
    ]
  );

  assert.match(
    details,
    /resolveOwnerCatalogCategory\(product\.category, categories\)\.icon/
  );

  assert.match(
    css,
    /\.actions\.ownProductActions\s*\{[\s\S]*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/
  );

  assert.match(
    css,
    /@media only screen and \(max-width: 767px\)[\s\S]*?\.adminMetadata[\s\S]*?grid-template-columns: minmax\(0, 1fr\)/
  );

  assert.match(owner, /<OwnProductTabHeading tab=\{activeTab\}/);
  assert.match(owner, /Loading own product details/);
  assert.match(stats, /Product sales across your pharmacies/);
});

//===================================================================

test('own product tabs resolve through catch-all without swallowing list filters', async () => {
  const [route, tabRoute] = await Promise.all([
    read('src/app/pharmacy/products/[[...filters]]/page.tsx'),
    read('src/app/pharmacy/products/[productId]/[tab]/page.tsx'),
  ]);

  assert.match(route, /isOwnProductsFilterRoute\(segments\)/);

  assert.match(
    route,
    /segments\?\.length === 2 && tab && isOwnProductDetailTab\(tab\)/
  );

  assert.match(
    route,
    /redirect\(getOwnProductDetailTabPath\(productId, tab\)\)/
  );

  assert.match(
    route,
    /return <OwnProductDetailsPageContent productId=\{productId\} \/>/
  );

  assert.match(
    tabRoute,
    /!isValidObjectId\(productId\) \|\| !isOwnProductDetailTab\(tab\)/
  );
});
