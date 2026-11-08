import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

//===================================================================

const read = (file: string) => readFile(resolve(process.cwd(), file), 'utf8');

//===================================================================

test('embedded pharmacy Products uses URL as source of truth and resets within pharmacy', async () => {
  const [page, drawer, parent] = await Promise.all([
    read(
      'src/components/products/OwnProductsPageContent/OwnerOwnProductsPageContent.tsx'
    ),

    read(
      'src/components/products/OwnProductsFiltersDrawer/OwnProductsFiltersDrawer.tsx'
    ),

    read(
      'src/components/pharmacies/OwnedPharmacyDetailPageContent/OwnedPharmacyDetailPageContent.tsx'
    ),
  ]);

  assert.match(page, /parseOwnProductsSegments\(\{ filters: segments \}\)/);

  assert.match(
    page,
    /parseOwnProductsPaginationSegments\(\{ filters: segments \}\)/
  );

  assert.match(page, /buildEmbeddedOwnProductsPath\(embeddedPharmacyId, next/);
  assert.match(page, /router\.push\(nextPath/);
  assert.doesNotMatch(drawer, /resetHref=\{PHARMACY_ROUTES\.PRODUCTS\}/);
  assert.match(parent, /loading \|\| pharmacy \? \(/);
});

//===================================================================

test('pharmacy Products page renders separated cards and aligned loading states', async () => {
  const [page, css] = await Promise.all([
    read(
      'src/components/products/OwnProductsPageContent/OwnerOwnProductsPageContent.tsx'
    ),

    read(
      'src/components/products/OwnProductsPageContent/OwnProductsPageContent.module.css'
    ),
  ]);

  assert.match(page, /statisticsLoading \? \(/);
  assert.match(page, /isLoading=\{isLoading\}/);
  assert.match(css, /\.embeddedCard[\s\S]*?background: var\(--color-surface\)/);

  assert.match(
    css,
    /\.embeddedCard[\s\S]*?box-shadow: var\(--shadow-card-soft\)/
  );
});

//===================================================================

test('client Purchased products filters remain owner scoped across nested URL routes', async () => {
  const [scope, detail, drawer, path] = await Promise.all([
    read('src/lib/pharmacies/selected-pharmacy-scope.ts'),

    read(
      'src/components/clients/ClientDetailsPageContent/ClientDetailsPageContent.tsx'
    ),

    read(
      'src/components/clients/ClientDetailsPageContent/ClientDetailFilters.tsx'
    ),

    read('src/lib/clients/client-purchased-products-paths.ts'),
  ]);

  assert.match(
    scope,
    /parseClientPurchasedProductsSegments\(purchased\[2\]!\.split/
  );

  assert.match(scope, /buildClientPurchasedProductsPath\(purchased\[1\]!/);
  assert.match(detail, /changeProductFilters\(DEFAULT_PRODUCT_FILTERS\)/);

  assert.doesNotMatch(
    drawer.slice(drawer.indexOf('type ClientProductsFiltersDrawerProps')),
    /resetHref=\{resetHref\}/
  );

  assert.match(path, /\/products\$\{generic\.slice/);
  assert.doesNotMatch(path, /\?pharmacyId=/);
});

//===================================================================

test('client purchased Product search loads only client order products with progressive loader', async () => {
  const [tab, selector] = await Promise.all([
    read(
      'src/components/clients/ClientDetailsPageContent/ClientProductsTab.tsx'
    ),

    read(
      'src/components/all-products/OwnerProductSearch/OwnerProductSearch.tsx'
    ),
  ]);

  assert.match(tab, /getPharmacyClientProducts\(/);
  assert.match(tab, /scope: 'owner'/);
  assert.match(tab, /keyword: params\.keyword/);
  assert.match(tab, /loadProducts=\{loadPurchasedProducts\}/);
  assert.match(selector, /hasMoreOptions/);
  assert.match(selector, /onLoadMore/);
});

//===================================================================

test('client product status New is not presented and table shows ID and Admin category icon', async () => {
  const [filters, columns, tab, details] = await Promise.all([
    read(
      'src/components/clients/ClientDetailsPageContent/ClientDetailFilters.tsx'
    ),

    read(
      'src/components/clients/ClientDetailsPageContent/ClientDetailTableColumns.tsx'
    ),

    read(
      'src/components/clients/ClientDetailsPageContent/ClientProductsTab.tsx'
    ),

    read(
      'src/components/clients/ClientDetailsPageContent/ClientDetailsPageContent.tsx'
    ),
  ]);

  assert.match(filters, /\['active', 'blocked'\]/);
  assert.match(columns, /key: 'productId'/);
  assert.match(columns, /buildClientProductColumns/);
  assert.match(columns, /iconByCategory\.get\(item\.category\.slug\)/);
  assert.match(tab, /categoryOptions/);
  assert.match(details, /activeTab === 'products' && clientStatus !== 'error'/);
  assert.doesNotMatch(details, /`Products \(\$\{productsOverallTotal\}\)`/);
});

//===================================================================

test('all product details Category icon is sourced from live Admin category directory', async () => {
  const detail = await read(
    'src/components/all-products/AllProductDetailsPageContent/AllProductDetailsPageContent.tsx'
  );

  assert.match(detail, /getProductCategories\(/);

  assert.match(
    detail,
    /resolveOwnerCatalogCategory\(product\.category, categoryDirectory\)\.icon/
  );
});
