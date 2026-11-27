import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

//===================================================================

const read = (path: string) =>
  readFileSync(new URL(path, import.meta.url), 'utf8');

//===================================================================

test('client breadcrumb labels animate independently of their home icon; cabinet paths do not', () => {
  const client = read(
    '../../../../../packages/ui/src/navigation/Breadcrumbs/Breadcrumbs.module.css'
  );

  const breadcrumb = read(
    '../../../../../packages/ui/src/navigation/Breadcrumbs/Breadcrumbs.tsx'
  );

  const cabinet = read(
    '../../../../../packages/ui/src/cabinet/CabinetTopBar/CabinetTopBar.module.css'
  );

  assert.match(client, /\.linkText::after/);
  assert.match(client, /\.link:hover \.linkText::after/);
  assert.match(breadcrumb, /items\[0\]\?\.label === 'Home'/);
  assert.match(breadcrumb, /<House size=\{15\}/);
  assert.match(cabinet, /\.pathNav \.link::after/);
  assert.match(cabinet, /content: none/);
});

//===================================================================

test('sales filters stay mounted while only the chart body reloads', () => {
  const ui = read('./PharmacyDetailsPageContent/PharmacySalesChart.tsx');

  const shared = read(
    '../../../../../packages/ui/src/charts/SalesValueChart/SalesValueChart.tsx'
  );

  assert.match(ui, /contentState=\{contentState\}/);
  assert.match(ui, /<SalesPeriodFilters/);
  assert.match(shared, /\{contentState \? \(/);
  assert.match(shared, /icon=\{<ChartNoAxesCombined/);
});

//===================================================================

test('self-loading tabs do not wait for another overview loading state', () => {
  const detail = read(
    './PharmacyDetailsPageContent/PharmacyDetailsPageContent.tsx'
  );

  const start = detail.indexOf("{activeTab === 'documents' ? (");
  const generalLoading = detail.indexOf(') : isLoading ? (', start);

  assert.ok(start > -1 && generalLoading > start);

  for (const tab of ['documents', 'comments', 'activity']) {
    assert.match(detail, new RegExp(`activeTab === '${tab}' \\?`));
  }
});

//===================================================================

test('pharmacy statistics hide the entire wrapper on mobile, including loading', () => {
  const detail = read(
    './PharmacyDetailsPageContent/PharmacyDetailsPageContent.tsx'
  );

  const css = read(
    './PharmacyDetailsPageContent/PharmacyDetailsPageContent.module.css'
  );

  assert.match(
    detail,
    /<div className=\{css.statistics\}>\s*\{metrics \? \([\s\S]*?<StatsGrid[\s\S]*?<StatsLoadingSkeleton/
  );

  assert.match(
    css,
    /max-width: 767px[\s\S]*?\.statistics\s*\{\s*display: none/
  );
});

//===================================================================

test('corrections use existing moderation and reactivation modal tones', () => {
  const actions = read(
    './PharmacyDetailsPageContent/PharmacyModerationActions.tsx'
  );

  assert.match(
    actions,
    /action.option.action === 'request_corrections' && detail.status === 'on_moderation'\s*\? 'moderation'/
  );

  assert.match(
    actions,
    /action.option.action === 'request_corrections' && detail.status === 'on_reactivation'\s*\? 'reactivation'/
  );
});
