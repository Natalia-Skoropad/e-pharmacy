import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

//===================================================================

const read = (relative: string) =>
  readFileSync(new URL(relative, import.meta.url), 'utf8');

//===================================================================

test('14.17.4: pharmacy overview uses only four nonduplicated metrics and no loading meta row', () => {
  const page = read(
    './PharmacyDetailsPageContent/PharmacyDetailsPageContent.tsx'
  );

  assert.deepEqual(
    [...page.matchAll(/<StatsCard\s+title="([^"]+)"/g)].map(
      (match) => match[1]
    ),
    [
      'Active clients',
      'Successful orders',
      'Added products',
      'Rating / reviews',
    ]
  );

  assert.match(page, /meta=\{formatMoney\(metrics\.successfulRevenue\)/);
  assert.match(page, /value=\{metrics\.addedProductsCount\}/);

  assert.match(
    page,
    /metrics\.reviewsCount \? metrics\.rating\.toFixed\(1\) : 0/
  );

  assert.doesNotMatch(page, /className=\{css\.detailMeta\}/);
  assert.doesNotMatch(page, /Loading pharmacy status and owner/);
  assert.match(page, /<StatsLoadingSkeleton/);
});

//===================================================================

test('14.17.4: moderation dropdown is color-coded and transitions display canonical badges', () => {
  const actions = read(
    './PharmacyDetailsPageContent/PharmacyModerationActions.tsx'
  );

  const styles = read(
    './PharmacyDetailsPageContent/PharmacyModerationActions.module.css'
  );

  assert.match(actions, /css\.approveAction/);
  assert.match(actions, /css\.correctionsAction/);
  assert.match(actions, /css\.dangerAction/);
  assert.equal((actions.match(/<StatusBadge/g) ?? []).length, 2);

  assert.match(
    actions,
    /PHARMACY_STATUS_PRESENTATION\[action\.option\.targetStatus\]/
  );

  assert.match(styles, /\.statusTransition/);
  assert.match(styles, /\.approveAction\s*\{/);
  assert.match(styles, /\.correctionsAction\s*\{/);
});

//===================================================================

test('14.17.4: published identity, copy controls, owner link, dates and chart are arranged without duplicates', () => {
  const info = read('./PharmacyDetailsPageContent/PharmacyInformationTab.tsx');
  const styles = read(
    './PharmacyDetailsPageContent/PharmacyInformationTab.module.css'
  );

  assert.doesNotMatch(info, /Published pharmacy identity|Published location/);
  assert.doesNotMatch(info, /label="Name"|View owner|Current status/);

  assert.match(
    styles,
    /\.detailsTable\s*\{[\s\S]*?grid-template-columns:\s*repeat\(2/
  );

  assert.match(info, /<CopyButton/);
  assert.match(info, /navigator\.clipboard\.writeText/);

  assert.match(
    info,
    /<TextActionButton\s+href=\{buildAdminPharmacyOwnerDetailUrl\(owner\.id\)\}/
  );

  assert.match(info, /className=\{css\.ownerIdRow\}/);
  assert.match(info, /<PharmacySalesChart pharmacyId=\{detail\.id\}/);

  assert.ok(
    info.indexOf('<PharmacySalesChart') <
      info.indexOf('Published data / Submitted changes')
  );
});

//===================================================================

test('14.17.4: chart is pharmacy-scoped, permission-checked, lazy, cancellable and reuses canonical sales chart', () => {
  const routes = read('../../../../api/src/routes/admin.routes.ts');

  const detailService = read(
    '../../../../api/src/services/admin-pharmacy-detail-read.service.ts'
  );

  const orderService = read('../../../../api/src/services/order.service.ts');
  const graph = read('./PharmacyDetailsPageContent/PharmacySalesChart.tsx');

  const bff = read(
    '../../app/api/admin/pharmacies/[pharmacyId]/sales-statistics/route.ts'
  );

  assert.match(
    routes,
    /'\/pharmacies\/:pharmacyId\/sales-statistics',[\s\S]*?ADMIN_PERMISSIONS\.pharmacies\.view/
  );

  assert.match(routes, /query: orderSalesStatisticsQuerySchema/);

  assert.match(
    detailService,
    /Pharmacy\.exists\(\{ _id: new Types\.ObjectId\(pharmacyId\) \}\)/
  );

  assert.match(
    detailService,
    /getOrderSalesStatisticsForPharmacyService\(pharmacyId, query\)/
  );

  assert.match(orderService, /pharmacyId: \{ \$in: pharmacyIds\.map/);
  assert.match(orderService, /status: 'successful'/);
  assert.match(orderService, /Order\.aggregate<OrderSalesAggregationRow>/);
  assert.match(graph, /getAdminPharmacySalesStatistics\(/);
  assert.match(graph, /controller\.abort\(\)/);
  assert.match(graph, /<SalesValueChart/);

  assert.match(
    bff,
    /API_ROUTES\.admin\.pharmacyDetail\.salesStatistics\(pharmacyId\)/
  );
});
