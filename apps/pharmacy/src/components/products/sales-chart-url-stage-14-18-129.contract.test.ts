import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

//===================================================================

const read = (path: string) => readFile(resolve(process.cwd(), path), 'utf8');

//===================================================================

test('pharmacy chart reads its period from canonical route and updates it on selection', async () => {
  const [component, route, resolver] = await Promise.all([
    read(
      'src/components/pharmacies/OwnedPharmacyDetailPageContent/OwnedPharmacySalesChart.tsx'
    ),

    read('src/app/pharmacy/pharmacies/[...filters]/page.tsx'),
    read('src/lib/pharmacies/owned-pharmacy-url.ts'),
  ]);

  assert.match(component, /usePathname\(\)/);
  assert.match(component, /buildSalesChartPath\(base/);
  assert.match(component, /onYearChange=\{\(value\) => updatePeriod/);
  assert.match(component, /onMonthChange=\{\(value\) => updatePeriod/);
  assert.match(route, /route\.salesSegments/);
  assert.match(resolver, /parseSalesChartSegments\(tail\)/);
});

//===================================================================

test('client chart supports refreshable detail-period routes', async () => {
  const [component, route] = await Promise.all([
    read(
      'src/components/clients/ClientDetailsPageContent/ClientSalesChart.tsx'
    ),

    read('src/app/pharmacy/clients/[clientId]/[tab]/[...filters]/page.tsx'),
  ]);

  assert.match(component, /getPharmacyClientPath\(clientId\)/);
  assert.match(component, /parseSalesChartSegments\(segments\)/);
  assert.match(component, /router\.push\(buildSalesChartPath/);
  assert.match(route, /tab === 'details'/);
  assert.match(route, /parseSalesChartSegments\(filters\)/);
});

//===================================================================

test('owner product statistics routes preserve selected pharmacy and sales year/month', async () => {
  const [component, route, fallback, tabs, breadcrumbs, scope] =
    await Promise.all([
      read(
        'src/components/products/OwnProductDetailsPageContent/OwnProductStatisticsTab.tsx'
      ),

      read('src/app/pharmacy/products/[productId]/[tab]/[...filters]/page.tsx'),
      read('src/app/pharmacy/products/[[...filters]]/page.tsx'),
      read('src/lib/products/own-product-detail-tabs.ts'),
      read('src/lib/layout/breadcrumbs.ts'),
      read('src/lib/pharmacies/selected-pharmacy-scope.ts'),
    ]);

  assert.match(
    component,
    /parseSalesChartSegments\(segments, \{ allowPharmacy: true \}\)/
  );

  assert.match(
    component,
    /buildSalesChartPath\(base, \{ \.\.\.filters, \.\.\.next \}, \{ allowPharmacy: true \}\)/
  );

  assert.match(
    component,
    /onChange=\{\(value\) => updateFilters\(\{ pharmacyId: value \}\)\}/
  );

  assert.match(route, /tab !== 'statistics'/);
  assert.match(route, /isOwnProductsFilterRoute\(allSegments\)/);
  assert.match(fallback, /segments\.slice\(2\), \{ allowPharmacy: true \}/);
  assert.match(tabs, /segment === 'statistics'/);
  assert.match(breadcrumbs, /tab === 'statistics'/);
  assert.match(scope, /parseSalesChartSegments\(sales\[2\]!\.split/);
  assert.match(scope, /parseSalesChartSegments\(clientSales\[2\]!\.split/);
});
