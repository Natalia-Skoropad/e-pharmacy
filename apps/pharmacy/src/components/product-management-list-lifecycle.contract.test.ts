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
  const route = await read(
    'src/app/pharmacy/all-products/[[...filters]]/page.tsx'
  );

  assert.match(route, /const initialFilters = parseAllProductsSegments/);

  assert.match(
    route,
    /<AllProductsPageContent[\s\S]*?key=\{JSON\.stringify\(initialFilters\)\}[\s\S]*?initialFilters=\{initialFilters\}/
  );
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
    assert.match(source, /role="alert"/);

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

  assert.match(
    productRequests,
    /useDebouncedValue\(filters\.requestNumber, 450\)/
  );

  assert.match(
    productRequests,
    /useDebouncedValue\(\s*filters\.productArticle,\s*450\s*\)/
  );

  assert.match(
    productRequests,
    /useDebouncedValue\(filters\.productName, 450\)/
  );

  assert.match(
    productRequests,
    /getProductRequestsQueryParams\(\s*requestFilters,/
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
