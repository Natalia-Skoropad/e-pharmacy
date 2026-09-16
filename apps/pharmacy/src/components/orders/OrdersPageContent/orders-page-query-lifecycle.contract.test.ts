import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

//===================================================================

const componentPath = path.resolve(
  process.cwd(),
  'src/components/orders/OrdersPageContent/OrdersPageContent.tsx'
);

//===================================================================

test('Orders page uses settled text filters for requests and URL updates', async () => {
  const source = await readFile(componentPath, 'utf8');

  assert.match(source, /useDebouncedValue\(textFilters, 450\)/);

  assert.match(
    source,
    /const requestTextFilters = routeTextOverride \?\? debouncedTextFilters/
  );

  assert.match(
    source,
    /applyDebouncedOrdersTextFilters\(immediateFilters, requestTextFilters\)/
  );

  assert.match(
    source,
    /getOrdersQueryParams\(requestFilters, rowsPerPage, currentPage\)/
  );

  assert.match(source, /buildOrdersPath\(requestFilters\)/);

  assert.doesNotMatch(
    source,
    /getOrdersQueryParams\(filters, rowsPerPage, currentPage\)/
  );
});

//===================================================================

test('Orders page accepts the backend canonical page without a duplicate GET', async () => {
  const source = await readFile(componentPath, 'utf8');

  assert.match(source, /response\.page !== queryParams\.page/);

  assert.match(
    source,
    /skipCanonicalPageRequestRef\.current = response\.page;[\s\S]{0,120}setCurrentPage\(response\.page\)/
  );

  assert.match(
    source,
    /skipCanonicalPageRequestRef\.current === queryParams\.page[\s\S]{0,120}return;/
  );
});

//===================================================================

test('Orders page ignores its own URL replacements when syncing route filters but restores external navigation', async () => {
  const source = await readFile(componentPath, 'utf8');

  assert.match(source, /internalRoutePathsRef\.current\.add\(nextPath\)/);

  assert.match(
    source,
    /internalRoutePathsRef\.current\.delete\(initialFiltersPath\)[\s\S]{0,100}return;/
  );

  assert.match(
    source,
    /setRouteTextOverride\(getOrdersTextFilterState\(initialFilters\)\)/
  );

  assert.match(
    source,
    /syncOrdersFiltersFromRoute\(currentFilters, initialFilters\)/
  );
});
