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

test('pharmacy detail layout uses desktop breakpoint only at 1440px and equal-height lower cards', () => {
  const css = read(
    './PharmacyDetailsPageContent/PharmacyInformationTab.module.css'
  );

  assert.match(css, /min-width: 1440px/);
  assert.doesNotMatch(css, /min-width: 1200px/);
  assert.match(css, /\.secondaryGrid > \.sectionCard/);
  assert.match(css, /height: 100%/);
  assert.match(css, /\.detailField dd a:hover/);
  assert.match(css, /text-decoration: none/);
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
