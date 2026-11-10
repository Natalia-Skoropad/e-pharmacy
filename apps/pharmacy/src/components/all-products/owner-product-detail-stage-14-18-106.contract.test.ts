import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

//===================================================================

const read = (path: string) => readFile(resolve(process.cwd(), path), 'utf8');

//===================================================================

const detailSource =
  'src/components/all-products/AllProductDetailsPageContent/AllProductDetailsPageContent.tsx';

const detailCss =
  'src/components/all-products/AllProductDetailsPageContent/AllProductDetailsPageContent.module.css';

//===================================================================

test('global catalog detail and tab routes remain canonical', async () => {
  const [helper, detailsRoute, tabRoute] = await Promise.all([
    read('src/lib/products/all-product-detail-tabs.ts'),
    read('src/app/pharmacy/all-products/[productId]/page.tsx'),
    read('src/app/pharmacy/all-products/[productId]/[tab]/page.tsx'),
  ]);

  assert.match(helper, /'details'[\s\S]*'characteristics'[\s\S]*'reviews'/);
  assert.match(helper, /tab === 'details' \? base : `\$\{base\}\/\$\{tab\}`/);

  assert.match(
    detailsRoute,
    /<AllProductDetailsPageContent productId=\{productId\}/
  );

  assert.match(tabRoute, /isAllProductsFilterRoute\(segments\)/);
  assert.match(tabRoute, /isValidObjectId\(productId\)/);
  assert.match(tabRoute, /getAllProductDetailTabPath\(productId, tab\)/);
});

//===================================================================

test('global tabs use pathname navigation and distinct icons without operational tabs', async () => {
  const source = await read(detailSource);

  assert.match(source, /parseAllProductDetailTabPath\(pathname, productId\)/);

  assert.match(
    source,
    /router\.push\(getAllProductDetailTabPath\(productId, tab\)/
  );

  assert.match(source, /label: 'Details', icon: <PackageSearch/);
  assert.match(source, /label: 'Characteristics', icon: <ClipboardList/);
  assert.match(source, /label: 'Reviews', icon: <MessageSquareText/);

  assert.doesNotMatch(
    source,
    /OwnProductStatistics|StockMovementTab|RelatedOrdersTab|mode === 'own'/
  );
});

//===================================================================

test('global and own product loaders stay below tab heading, never block the entire page', async () => {
  const [global, own] = await Promise.all([
    read(detailSource),

    read(
      'src/components/products/OwnProductDetailsPageContent/OwnProductDetailsPageContent.tsx'
    ),
  ]);

  for (const source of [global, own]) {
    assert.match(source, /<Tabs items=/);

    assert.match(
      source,
      /<ProfileResourceState variant=\{error \? 'error' : 'loading'\}/
    );

    assert.doesNotMatch(source, /<LoadingSpinner[^>]*fullPage/);
  }

  assert.match(global, /<CatalogTabHeading tab=\{activeTab\}/);
  assert.match(own, /<OwnProductTabHeading tab=\{activeTab\}/);
});

//===================================================================

test('catalog metadata preserves Admin field order and live category icon', async () => {
  const source = await read(detailSource);
  const start = source.indexOf('<dl className={css.adminMetadata}>');
  const list = source.slice(start, source.indexOf('</dl>', start));

  assert.ok(start >= 0);

  assert.deepEqual(
    [...list.matchAll(/<dt>([^<]+)<\/dt>/g)].map((match) => match[1]),
    [
      'Status',
      'Category',
      'Article',
      'Product ID',
      'Admin creation date',
      'Admin last update date',
    ]
  );

  assert.match(source, /getProductCategories\(/);

  assert.match(
    source,
    /resolveOwnerCatalogCategory\(product\.category, categoryDirectory\)\.icon/
  );
});

//===================================================================

test('catalog add action remains full-width, eligibility checked, with no secondary request CTA', async () => {
  const [source, css] = await Promise.all([
    read(detailSource),
    read(detailCss),
  ]);

  assert.match(source, /!isAdded \? <div className=\{css\.ownerActions\}>/);
  assert.match(source, /ownerHasEligiblePharmacies/);
  assert.match(source, /<Plus size=\{17\}/);
  assert.match(css, /\.ownerActions \.actionButton\s*\{\s*width: 100%/);
  assert.doesNotMatch(source, /Request another product|Back to own products/);
});

//===================================================================

test('catalog Reviews are independently loaded through owner-scoped endpoint', async () => {
  const source = await read(detailSource);

  assert.match(source, /getOwnerCatalogProductReviews\(productId/);
  assert.match(source, /Reviews are temporarily unavailable/);
  assert.match(source, /retryLabel="Try again"/);
  assert.match(source, /<ReviewsList/);
  assert.doesNotMatch(source, /getProductReviews\(productId/);
});

//===================================================================

test('catalog breadcrumbs preserve global product then tab', async () => {
  const source = await read('src/lib/layout/breadcrumbs.ts');

  assert.match(source, /isAllProductDetailTab\(tab\)/);

  assert.match(
    source,
    /label: 'All products', href: PHARMACY_ROUTES\.ALL_PRODUCTS/
  );

  assert.match(source, /label: tabLabels\[tab\]/);
});
