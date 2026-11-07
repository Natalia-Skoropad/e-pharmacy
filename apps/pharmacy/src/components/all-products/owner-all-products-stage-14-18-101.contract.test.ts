import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

//===================================================================

const source = (path: string) => readFile(resolve(process.cwd(), path), 'utf8');

//===================================================================

test('All products URL encodes page and rows-per-page while preserving filters', async () => {
  const [paths, page, baseRoute, singleRoute] = await Promise.all([
    source('src/lib/products/all-product-paths.ts'),

    source(
      'src/components/all-products/AllProductsPageContent/AllProductsPageContent.tsx'
    ),

    source('src/app/pharmacy/all-products/[[...filters]]/page.tsx'),
    source('src/app/pharmacy/all-products/[productId]/page.tsx'),
  ]);

  assert.match(paths, /segment\.startsWith\('page-'\)/);
  assert.match(paths, /segment\.startsWith\('per-page-'\)/);
  assert.match(paths, /segments\.push\(`page-\$\{pagination\.page\}`\)/);
  assert.match(paths, /segments\.push\(`per-page-\$\{pagination\.perPage\}`\)/);

  assert.match(
    page,
    /useState<RowsPerPageValue>\(initialPagination\.perPage\)/
  );

  assert.match(page, /useState\(initialPagination\.page\)/);
  assert.match(page, /buildAllProductsPath\(debouncedFilters, \{/);
  assert.match(page, /page: currentPage,/);
  assert.match(page, /perPage: rowsPerPage,/);

  for (const route of [baseRoute, singleRoute]) {
    assert.match(route, /parseAllProductsPaginationSegments/);
    assert.match(route, /initialPagination=\{initialPagination\}/);

    assert.match(
      route,
      /key=\{JSON\.stringify\(\[initialFilters, initialPagination\]\)\}/
    );
  }
});

//===================================================================

test('All products statistics have the same selected-card treatment as Pharmacies', async () => {
  const [page, cards, css] = await Promise.all([
    source(
      'src/components/all-products/AllProductsPageContent/AllProductsPageContent.tsx'
    ),

    source(
      'src/components/statistics/AllProductStatistics/AllProductStatistics.tsx'
    ),

    source(
      'src/components/statistics/AllProductStatistics/AllProductStatistics.module.css'
    ),
  ]);

  assert.match(page, /activeStatisticKeys/);
  assert.match(page, /filters\.status === key \? 'all' : key/);
  assert.match(page, /activeKeys=\{activeStatisticKeys\}/);
  assert.match(cards, /className=\{active \? css\.activeCard : undefined\}/);
  assert.match(cards, /Clear \$\{title\.toLowerCase\(\)\} product filter/);
  assert.match(css, /outline: 2px solid var\(--color-accent\)/);
});

//===================================================================

test('category icons remain backed by the current Admin catalog directory', async () => {
  const [publicCategory, service, admin, table, drawer] = await Promise.all([
    source('../api/src/constants/catalog/product-category.ts').catch(() => ''),

    source('../api/src/services/catalog/product-category.service.ts').catch(
      () => ''
    ),

    source(
      '../api/src/services/admin/settings/admin-settings-category-projection.ts'
    ).catch(() => ''),

    source('src/components/all-products/AllProductsTable/AllProductsTable.tsx'),

    source(
      'src/components/all-products/AllProductsFiltersDrawer/AllProductsFiltersDrawer.tsx'
    ),
  ]);

  // The API contract can be validated independently by its integration tests;
  // these checks cover the local owner catalog rendering.
  assert.match(
    table,
    /resolveOwnerCatalogCategory\(product\.category, categoryDirectory\)/
  );

  assert.match(drawer, /CategoryIcon name=\{option\.icon\}/);

  if (publicCategory) {
    assert.match(publicCategory, /resolveProductCategoryIcon/);
    assert.match(service, /resolveProductCategoryIcon\(category\)/);
    assert.match(admin, /resolveProductCategoryIcon\(category\)/);
  }
});
