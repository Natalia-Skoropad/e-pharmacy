import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

//===================================================================

async function read(relativePath: string): Promise<string> {
  return readFile(resolve(process.cwd(), relativePath), 'utf8');
}

//===================================================================

test('all products remounts from canonical server filters like the other list routes', async () => {
  const routes = await Promise.all([
    read('src/app/pharmacy/all-products/[[...filters]]/page.tsx'),
    read('src/app/pharmacy/all-products/[productId]/page.tsx'),
  ]);

  for (const route of routes) {
    assert.match(route, /const initialFilters = parseAllProductsSegments/);

    assert.match(
      route,
      /<AllProductsPageContent[\s\S]*?key=\{JSON\.stringify\(\[initialFilters, initialPagination\]\)\}[\s\S]*?initialFilters=\{initialFilters\}[\s\S]*?initialPagination=\{initialPagination\}/
    );
  }
});

//===================================================================

test('list failures preserve loaded rows and expose an explicit error state', async () => {
  const sources = await Promise.all([
    read(
      'src/components/all-products/AllProductsPageContent/AllProductsPageContent.tsx'
    ),

    read(
      'src/components/products/OwnProductsPageContent/OwnProductsPageContent.tsx'
    ),

    read(
      'src/components/product-requests/ProductRequestsPageContent/ProductRequestsPageContent.tsx'
    ),
  ]);

  for (const source of sources) {
    assert.match(source, /const \[loadError, setLoadError\]/);
    assert.match(source, /role="alert"|<ProfileResourceState/);

    assert.doesNotMatch(
      source,
      /catch\s*\{[\s\S]{0,260}?set(?:Products|Requests)\(\[\]\)/
    );
  }
});

//===================================================================

test('text search is debounced before request query construction', async () => {
  const [allProducts, ownProducts, productRequests] = await Promise.all([
    read(
      'src/components/all-products/AllProductsPageContent/AllProductsPageContent.tsx'
    ),

    read(
      'src/components/products/OwnProductsPageContent/OwnProductsPageContent.tsx'
    ),

    read(
      'src/components/product-requests/ProductRequestsPageContent/ProductRequestsPageContent.tsx'
    ),
  ]);

  assert.match(allProducts, /useDebouncedValue\(filters\.name, 450\)/);
  assert.match(allProducts, /useDebouncedValue\(filters\.article, 450\)/);
  assert.match(allProducts, /getProductsQueryParams\(\s*requestFilters,/);

  assert.match(ownProducts, /useDebouncedValue\(filters\.name, 450\)/);
  assert.match(ownProducts, /useDebouncedValue\(filters\.article, 450\)/);
  assert.match(ownProducts, /getProductsQueryParams\(\s*requestFilters,/);

  assert.match(productRequests, /<OwnerProductRequestSearch/);
  assert.doesNotMatch(productRequests, /<OwnerRequestedProductSearch/);
  assert.match(productRequests, /getProductRequestsQueryParams\(filters,/);
  assert.doesNotMatch(productRequests, /requestNumber: debouncedRequestNumber/);

  assert.doesNotMatch(
    productRequests,
    /productArticle: debouncedProductArticle/
  );
});

//===================================================================

test('own products statistics reuse the management list response', async () => {
  const source = await read(
    'src/components/products/OwnProductsPageContent/OwnProductsPageContent.tsx'
  );

  assert.doesNotMatch(source, /getPharmacyOwnProductStatistics/);
  assert.match(source, /setProductStatistics\(response\.statistics\)/);
});

//===================================================================

test('product lists clamp pagination after mutations and server total changes', async () => {
  const [allProducts, ownProducts] = await Promise.all([
    read(
      'src/components/all-products/AllProductsPageContent/AllProductsPageContent.tsx'
    ),

    read(
      'src/components/products/OwnProductsPageContent/OwnProductsPageContent.tsx'
    ),
  ]);

  for (const source of [allProducts, ownProducts]) {
    assert.match(source, /clampProductListPage/);
    assert.match(source, /normalizedPage !== currentPage/);
    assert.match(source, /setCurrentPage\(normalizedPage\)/);

    assert.match(
      source,
      /handleFiltersChange[\s\S]{0,220}?setCurrentPage\(1\)/
    );

    assert.match(
      source,
      /handleRowsPerPageChange[\s\S]{0,220}?setCurrentPage\(1\)/
    );
  }

  assert.match(allProducts, /leavesCurrentResultSet/);
  assert.match(allProducts, /setCurrentPage\(nextPage\)/);
  assert.match(ownProducts, /nextTotalProducts/);
  assert.match(ownProducts, /setCurrentPage\(nextPage\)/);
});

//===================================================================

test('list requests abort stale generations before they can overwrite newer state', async () => {
  const sources = await Promise.all([
    read(
      'src/components/all-products/AllProductsPageContent/AllProductsPageContent.tsx'
    ),

    read(
      'src/components/products/OwnProductsPageContent/OwnProductsPageContent.tsx'
    ),

    read(
      'src/components/product-requests/ProductRequestsPageContent/ProductRequestsPageContent.tsx'
    ),
  ]);

  for (const source of sources) {
    assert.match(source, /const controller = new AbortController\(\)/);
    assert.match(source, /signal:\s*controller\.signal/);
    assert.match(source, /controller\.signal\.aborted/);
    assert.match(source, /return \(\) => \{\s*controller\.abort\(\);\s*\}/);
  }
});

//===================================================================

test('product management list failures expose explicit retry generations', async () => {
  const [allProducts, ownProducts, productRequests] = await Promise.all([
    read(
      'src/components/all-products/AllProductsPageContent/AllProductsPageContent.tsx'
    ),

    read(
      'src/components/products/OwnProductsPageContent/OwnProductsPageContent.tsx'
    ),

    read(
      'src/components/product-requests/ProductRequestsPageContent/ProductRequestsPageContent.tsx'
    ),
  ]);

  assert.match(allProducts, /title="Product statistics could not be loaded"/);
  assert.match(allProducts, /onRetry=\{reloadStatistics\}/);
  assert.match(allProducts, /Retry products/);
  assert.match(allProducts, /setRefreshVersion/);

  assert.match(ownProducts, /Retry own products/);
  assert.match(ownProducts, /setRefreshVersion/);

  assert.match(productRequests, /const \[retryVersion, setRetryVersion\]/);
  assert.match(productRequests, /onRetry=\{reloadStatistics\}/);
  assert.match(productRequests, /StatsLoadingSkeleton/);
  assert.match(productRequests, /Retry product requests/);
});

//===================================================================

test('product listing errors use the shared resource-state component with retry in all three views', async () => {
  const [allProducts, ownerProducts, pharmacyProducts] = await Promise.all([
    read(
      'src/components/all-products/AllProductsPageContent/AllProductsPageContent.tsx'
    ),

    read(
      'src/components/products/OwnProductsPageContent/OwnerOwnProductsPageContent.tsx'
    ),

    read(
      'src/components/products/OwnProductsPageContent/OwnProductsPageContent.tsx'
    ),
  ]);

  for (const source of [allProducts, ownerProducts, pharmacyProducts]) {
    assert.match(
      source,
      /<ProfileResourceState\s+variant="error"\s+title="(?:Own products|Products) are temporarily unavailable"/
    );

    assert.match(source, /description=\{loadError\}/);
    assert.match(source, /sideActionOnDesktop/);
    assert.match(source, /onRetry=/);

    assert.doesNotMatch(
      source,
      /<StatusBanner[\s\S]{0,140}?title="(?:Own products|Products) are temporarily unavailable"/
    );
  }
});

//===================================================================

test('successful product mutations update local rows and retain the current refresh policy', async () => {
  const [allProducts, ownProducts] = await Promise.all([
    read(
      'src/components/all-products/AllProductsPageContent/AllProductsPageContent.tsx'
    ),

    read(
      'src/components/products/OwnProductsPageContent/OwnProductsPageContent.tsx'
    ),
  ]);

  const allProductsMutation = allProducts.match(
    /const handleConfirmAddProduct = async \(\) => \{([\s\S]*?)\n  \};/
  )?.[1];

  const ownProductsMutation = ownProducts.match(
    /const handleRemoveProductConfirm = async \(\) => \{([\s\S]*?)\n  \};/
  )?.[1];

  assert.ok(allProductsMutation);
  assert.ok(ownProductsMutation);

  assert.match(allProductsMutation, /response\.product/);
  assert.match(allProductsMutation, /setProducts/);
  assert.match(allProductsMutation, /reloadStatistics\(\)/);
  assert.doesNotMatch(allProductsMutation, /getOwnerCatalogProducts\(/);

  assert.match(ownProductsMutation, /applyRemovedOwnProductStatistics/);
  assert.doesNotMatch(ownProductsMutation, /setRefreshVersion/);

  assert.match(allProducts, /Retry products/);
  assert.match(ownProducts, /Retry own products/);
});
