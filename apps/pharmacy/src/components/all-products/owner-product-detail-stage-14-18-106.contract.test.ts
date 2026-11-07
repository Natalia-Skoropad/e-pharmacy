import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

//===================================================================

const read = (path: string) => readFile(resolve(process.cwd(), path), 'utf8');

const detailSource =
  'src/components/all-products/AllProductDetailsPageContent/AllProductDetailsPageContent.tsx';

//===================================================================

test('owner catalog product tabs have distinct canonical routes', async () => {
  const [helper, detailsRoute, tabRoute] = await Promise.all([
    read('src/lib/products/all-product-detail-tabs.ts'),
    read('src/app/pharmacy/all-products/[productId]/page.tsx'),
    read('src/app/pharmacy/all-products/[productId]/[tab]/page.tsx'),
  ]);

  assert.match(helper, /'details'[\s\S]*'characteristics'[\s\S]*'reviews'/);
  assert.match(helper, /tab === 'details' \? base : `\$\{base\}\/\$\{tab\}`/);
  assert.match(detailsRoute, /mode="all"/);
  assert.match(tabRoute, /isAllProductsFilterRoute\(segments\)/);

  assert.match(
    tabRoute,
    /buildAllProductsPath\(initialFilters, initialPagination\)/
  );

  assert.match(tabRoute, /<AllProductsPageContent/);
  assert.match(tabRoute, /isValidObjectId\(productId\)/);
  assert.match(tabRoute, /isAllProductDetailTab\(tab\)/);

  assert.match(
    tabRoute,
    /redirect\(getAllProductDetailTabPath\(productId, tab\)\)/
  );
});

//===================================================================

test('owner catalog tabs are pathname driven and have icons without reviews counter', async () => {
  const source = await read(detailSource);

  assert.match(source, /parseAllProductDetailTabPath\(pathname, productId\)/);

  assert.match(
    source,
    /router\.push\(getAllProductDetailTabPath\(productId, tab\)/
  );

  assert.match(
    source,
    /dispatchPharmacyBreadcrumbLabel\(product\.name\);[\s\S]{0,45}pathname/
  );

  assert.match(source, /label: 'Details', icon:/);
  assert.match(source, /label: 'Characteristics', icon:/);
  assert.match(source, /label: 'Reviews', icon:/);
  assert.match(source, /mode !== 'all' && tab\.value === 'reviews'/);
});

//===================================================================

test('owner product loads below tab heading, not as full page loader', async () => {
  const source = await read(detailSource);

  assert.match(source, /mode !== 'all' && isLoading/);

  assert.match(
    source,
    /mode === 'all' && \(isLoading \|\| error \|\| !product\)/
  );

  assert.match(source, /<ProductTabHeading tab=\{activeTab\} \/>/);

  assert.match(
    source,
    /<ProfileResourceState[\s\S]*?variant=\{error \? 'error' : 'loading'\}/
  );
});

//===================================================================

test('owner product Admin summary is grouped in fixed order and has Product ID', async () => {
  const source = await read(detailSource);
  const beginning = source.indexOf('<dl className={css.adminMetadata}>');

  assert.ok(beginning > 0);

  const summary = source.slice(beginning, source.indexOf('</dl>', beginning));

  const labels = [...summary.matchAll(/<dt>([^<]+)<\/dt>/g)].map(
    (match) => match[1]
  );

  assert.deepEqual(labels, [
    'Status',
    'Category',
    'Article',
    'Product ID',
    'Admin creation date',
    'Admin last update date',
  ]);
});

//===================================================================

test('owner product add action is full-width with plus icon and no Back link', async () => {
  const [source, css] = await Promise.all([
    read(detailSource),

    read(
      'src/components/all-products/AllProductDetailsPageContent/AllProductDetailsPageContent.module.css'
    ),
  ]);

  assert.match(
    source,
    /className=\{mode === 'all' \? css\.ownerActions : css\.actions\}/
  );

  assert.match(
    source,
    /iconLeft=\{mode === 'all' && product\.status === 'active' && !isAddedToPharmacy \? <Plus/
  );

  assert.match(source, /\{mode !== 'all' \? <LinkButton/);
  assert.match(css, /\.ownerActions \.actionButton\s*\{\s*width:\s*100%/);
});

//===================================================================

test('Reviews use owner-scoped endpoint with explicit error and retry, while Own products keep management endpoint', async () => {
  const [source, api, route] = await Promise.all([
    read(detailSource),
    read('src/lib/api/browser/owner-all-products.api.ts'),
    read('src/app/api/products/[productId]/owner-reviews/route.ts'),
  ]);

  assert.match(
    source,
    /mode === 'all'[\s\S]{0,100}getOwnerCatalogProductReviews/
  );

  assert.match(source, /: getProductReviews\(productId/);

  assert.match(
    source,
    /variant="error"[\s\S]*onRetry=\{\(\) => setReviewsRetry/
  );

  assert.match(api, /pharmacyApiRoutes\.products\.ownerReviews\(productId\)/);
  assert.match(route, /managementReviews\(productId\)\}\?ownerCatalog=true/);
});

//===================================================================

test('owner product tab breadcrumbs include linked product and final tab label', async () => {
  const source = await read('src/lib/layout/breadcrumbs.ts');

  assert.match(source, /route\.segments\.length === 2/);
  assert.match(source, /isAllProductDetailTab\(tab\)/);

  assert.match(
    source,
    /label: 'All products', href: PHARMACY_ROUTES\.ALL_PRODUCTS/
  );

  assert.match(source, /label: tabLabels\[tab\]/);
});

//===================================================================

test('owner catalog detail icons match All products navigation and Characteristics has a distinct icon', async () => {
  const [source, navigation] = await Promise.all([
    read(detailSource),
    read('src/lib/layout/navigation.ts'),
  ]);

  assert.match(
    navigation,
    /label: 'All products',[\s\S]*?icon: createNavigationIcon\(PackageSearch\)/
  );

  assert.match(
    source,
    /const ALL_PRODUCT_DETAILS_TABS:[\s\S]*?label: 'Details', icon: <PackageSearch size=\{17\}/
  );

  assert.match(
    source,
    /const ALL_PRODUCT_DETAILS_TABS:[\s\S]*?label: 'Characteristics', icon: <ClipboardList size=\{17\}/
  );

  assert.match(source, /details: \{[\s\S]*?icon: <PackageSearch size=\{21\}/);

  assert.match(
    source,
    /characteristics: \{[\s\S]*?icon: <ClipboardList size=\{21\}/
  );

  assert.match(
    source,
    /mode === 'all' \? ALL_PRODUCT_DETAILS_TABS : PRODUCT_DETAILS_TABS/
  );
});

//===================================================================

test('mobile owner product metadata matches single-column client cards without changing tablet/desktop', async () => {
  const [source, css, clientCss] = await Promise.all([
    read(detailSource),

    read(
      'src/components/all-products/AllProductDetailsPageContent/AllProductDetailsPageContent.module.css'
    ),

    read(
      'src/components/clients/ClientDetailsPageContent/ClientDetailsPageContent.module.css'
    ),
  ]);

  assert.match(
    source,
    /mode === 'all'[\s\S]*?<dl className=\{css\.adminMetadata\}>/
  );

  assert.match(
    css,
    /@media only screen and \(max-width: 767px\) \{\s*\.adminMetadata \{\s*grid-template-columns: minmax\(0, 1fr\)/
  );

  assert.match(css, /\.adminMetadataItem \{\s*gap: 6px;\s*padding: 10px 12px;/);

  assert.match(
    css,
    /@media only screen and \(min-width: 600px\) \{\s*\.adminMetadata \{\s*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/
  );

  assert.match(clientCss, /\.detailsList div \{[\s\S]*?padding: 10px 12px;/);
});
