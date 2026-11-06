import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

//===================================================================

const read = (path: string) =>
  readFileSync(resolve(process.cwd(), 'src', path), 'utf8');

//===================================================================

test('client overview keeps tabs and section heading visible while details load', () => {
  const page = read(
    'components/clients/ClientDetailsPageContent/ClientDetailsPageContent.tsx'
  );

  assert.match(page, /<ProfileSectionHeader[\s\S]*?title="Client information"/);
  assert.match(page, /title="Loading client details"/);
  assert.match(page, /<ProfileResourceState/);
  assert.match(page, /<Tabs/);
  assert.doesNotMatch(page, /<LoadingSpinner/);
  assert.match(page, /getClientDisplayName\(client\)/);
});

//===================================================================

test('client status cards have independent error, loading, zero-data and retry states', () => {
  const card = read(
    'components/clients/ClientDetailsPageContent/ClientOrderStatistics.tsx'
  );

  const browser = read('lib/api/browser/clients.api.ts');

  assert.match(card, /getPharmacyClientOrderStatistics\(clientId/);
  assert.match(card, /<StatsLoadingSkeleton/);
  assert.match(card, /<ProfileResourceState/);
  assert.match(card, /<OrderStatistics counts=\{current\.data\}/);
  assert.match(card, /onRetry=/);
  assert.match(browser, /Number\.isSafeInteger\(item\.count\)/);
  assert.match(browser, /item\.count < 0/);
});

//===================================================================

test('client chart uses shared category graph and period filters', () => {
  const chart = read(
    'components/clients/ClientDetailsPageContent/ClientSalesChart.tsx'
  );

  assert.match(chart, /getPharmacyClientSalesStatistics\(/);
  assert.match(chart, /<SalesValueChart/);
  assert.match(chart, /<SalesPeriodFilters/);
  assert.match(chart, /variant="loading"/);
  assert.match(chart, /variant="error"/);
  assert.match(chart, /categories: \[\]/);
  assert.match(chart, /points: \[\]/);
});

//===================================================================

test('client tabs have section icons and are split into independent components', () => {
  const page = read(
    'components/clients/ClientDetailsPageContent/ClientDetailsPageContent.tsx'
  );

  for (const component of [
    'ClientInformationTab',
    'ClientOrdersTab',
    'ClientProductsTab',
  ]) {
    assert.match(page, new RegExp(`<${component}`));
  }

  for (const tab of [
    'details',
    'orders',
    'pharmacies',
    'products',
    'comments',
  ]) {
    assert.match(page, new RegExp(`value: '${tab}',[\\s\\S]*?icon:`));
  }

  assert.doesNotMatch(
    read(
      'components/clients/ClientDetailsPageContent/ClientInformationTab.tsx'
    ),
    /<h2>Client information<\/h2>/
  );
});

//===================================================================

test('owner client subtab breadcrumbs include the clickable client detail', () => {
  const breadcrumbs = read('lib/layout/breadcrumbs.ts');

  assert.match(breadcrumbs, /clientTabLabels: Record<string, string>/);

  assert.match(
    breadcrumbs,
    /label: currentDetailLabel \?\? `Client #\$\{clientId\}`/
  );

  assert.match(
    breadcrumbs,
    /href: `\$\{PHARMACY_ROUTES\.CLIENTS\}\/\$\{clientId\}`/
  );
});
