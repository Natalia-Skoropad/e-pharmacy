import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

//===================================================================

const read = (path: string) => readFile(new URL(path, import.meta.url), 'utf8');

//===================================================================

test('dashboard resources have independent keyed loading, retry and cancellation', async () => {
  const [resources, section, chart] = await Promise.all([
    read('./PharmacyDashboardPageContent/dashboard-resources.ts'),
    read('./PharmacyDashboardPageContent/DashboardStatisticsSection.tsx'),
    read('./PharmacyDashboardPageContent/DashboardSalesChart.tsx'),
  ]);

  assert.match(
    resources,
    /JSON\.stringify\(\[pharmacyId, year, month, retry\]\)/
  );

  assert.match(resources, /snapshot\?\.key === key/);
  assert.match(resources, /controller\.abort\(\)/);
  assert.match(resources, /!controller\.signal\.aborted/);
  assert.match(resources, /setRetry\(\(value\) => value \+ 1\)/);
  assert.match(section, /<StatsLoadingSkeleton/);
  assert.match(section, /variant="error"/);
  assert.match(section, /onRetry=\{resource\.retry\}/);
  assert.match(chart, /contentState=\{contentState\}/);
  assert.match(chart, /variant="loading"/);
  assert.doesNotMatch(chart, /showAppliedPeriod|LoadingSpinner|router\./);
});

//===================================================================

test('dashboard uses owner-wide data, narrows by explicit pharmacy and hides owner-only blocks', async () => {
  const [page, resources, route, selector] = await Promise.all([
    read('./PharmacyDashboardPageContent/PharmacyDashboardPageContent.tsx'),
    read('./PharmacyDashboardPageContent/dashboard-resources.ts'),
    read('../../app/pharmacy/dashboard/[pharmacyFilter]/page.tsx'),
    read('../pharmacies/OwnedPharmacySearch/OwnedPharmacySearch.tsx'),
  ]);

  assert.match(page, /<OwnedPharmacySearch/);
  assert.match(page, /statisticsContext="dashboard"/);
  assert.match(page, /!pharmacyId \? <GlobalCatalogStatistics/);
  assert.match(page, /SalesChartFilterToolbar/);

  assert.doesNotMatch(
    page,
    /usePharmacyProfile|LoadingSpinner|StatusBanner|showAppliedPeriod/
  );

  assert.match(
    resources,
    /scope: 'owner' as const, pharmacyId: pharmacyId \|\| undefined/
  );

  assert.match(
    resources,
    /getPharmacyOrders\(\s*\{\s*\.\.\.ownerScope\(pharmacyId\)/
  );

  assert.match(
    resources,
    /getPharmacyClients\(\s*\{\s*\.\.\.ownerScope\(pharmacyId\)/
  );

  assert.match(
    resources,
    /getPharmacyOrderSalesStatistics\(\s*\{\s*\.\.\.ownerScope\(pharmacyId\)/
  );

  assert.match(resources, /getOwnerOwnProducts\(/);
  assert.match(resources, /getOwnerCatalogStatistics\(/);
  assert.match(route, /notFound\(\)/);
  assert.match(route, /pharmacyId=\{pharmacyId\}/);
  assert.match(selector, /hasMoreOptions=/);
  assert.match(selector, /onLoadMore=/);

  assert.match(
    selector,
    /\['dashboard', 'clients', 'client-sales'\]\.includes\(\s*statisticsContext\s*\)/
  );
});

//===================================================================

test('dashboard outer fallbacks preserve cabinet geometry without mounting private data', async () => {
  const [shell, guard, root, skeleton] = await Promise.all([
    read('../layout/PharmacyShell/PharmacyShell.tsx'),
    read('../auth/PharmacyProtectedRoute.tsx'),
    read('../../app/loading.tsx'),
    read('../layout/PharmacyShell/DashboardShellSkeleton.tsx'),
  ]);

  for (const source of [shell, guard, root])
    assert.match(source, /<DashboardShellSkeleton/);

  assert.match(skeleton, /<Container/);
  assert.match(skeleton, /<CabinetSidebar/);
  assert.match(skeleton, /<CabinetTopBar/);

  assert.doesNotMatch(
    skeleton,
    /useAuth|usePharmacySelection|getOwnedPharmacyStatistics/
  );
});

//===================================================================

test('dashboard fallback preserves descriptions, action slots, period filters and order amount skeletons', async () => {
  const [skeleton, shell, styles, section, page] = await Promise.all([
    read('./PharmacyDashboardPageContent/DashboardPageSkeleton.tsx'),
    read('../layout/PharmacyShell/DashboardShellSkeleton.tsx'),
    read('../layout/PharmacyShell/PharmacyShell.module.css'),
    read('./PharmacyDashboardPageContent/DashboardStatisticsSection.tsx'),
    read('./PharmacyDashboardPageContent/PharmacyDashboardPageContent.tsx'),
  ]);

  assert.match(skeleton, /labelAccessory=/);
  assert.match(skeleton, /<SalesPeriodFilters/);
  assert.match(skeleton, /headerContent=\{<PeriodSkeleton/);
  assert.match(skeleton, /\.\.\.DASHBOARD_SECTIONS\.orders/);
  assert.match(section, /description=\{description\}/);
  assert.match(section, /metaCount=\{metaCount\}/);
  assert.match(section, /metaCount: 4/);
  assert.match(page, /\.\.\.DASHBOARD_SECTIONS\.orders/);
  assert.match(shell, /loadingHeaderAvatar/);

  assert.match(
    styles,
    /@media \(min-width: 1440px\)\s*\{\s*\.loadingHeaderMenu\s*\{\s*display: none/
  );
});
