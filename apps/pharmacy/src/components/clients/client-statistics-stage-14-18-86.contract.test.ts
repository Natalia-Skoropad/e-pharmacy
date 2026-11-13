import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

//===================================================================

const read = (path: string) =>
  readFileSync(resolve(process.cwd(), 'src', path), 'utf8');

//===================================================================

const pagePath = 'components/clients/ClientsPageContent/ClientsPageContent.tsx';

const detailPath =
  'components/pharmacies/OwnedPharmacyDetailPageContent/OwnedPharmacyDetailPageContent.tsx';

//===================================================================

test('Client statistics show Total, Active and Blocked only, with a distinct Total tone', () => {
  const statistics = read(
    'components/statistics/ClientStatistics/ClientStatistics.tsx'
  );

  const page = read(pagePath);

  const config =
    statistics.split('const CLIENT_STATISTICS_CONFIG:')[1]?.split('];')[0] ??
    '';

  for (const key of ['total', 'active', 'blocked']) {
    assert.match(config, new RegExp(`key: '${key}'`));
  }

  assert.doesNotMatch(config, /key: 'repeat'/);
  assert.match(config, /key: 'total', tone: 'purple'/);
  assert.match(config, /key: 'active', tone: 'green'/);
  assert.match(statistics, /columns=\{3\}/);
  assert.match(page, /count=\{3\}[\s\S]*?label="Loading client statistics"/);
});

//===================================================================

test('Client status statistic links retain the independent Successful orders filter', () => {
  const page = read(pagePath);

  const linkHandler =
    page
      .split('const getClientStatisticHref =')[1]
      ?.split('const { status: currentPharmacyStatus }')[0] ?? '';

  assert.match(linkHandler, /\{ \.\.\.routeFilters, status \}/);
  assert.match(linkHandler, /filters\.status === 'active' \? 'all' : 'active'/);

  assert.match(
    linkHandler,
    /filters\.status === 'blocked' \? 'all' : 'blocked'/
  );

  assert.doesNotMatch(linkHandler, /successfulOrders\s*:/);
  assert.doesNotMatch(linkHandler, /key === 'repeat'/);
});

//===================================================================

test('Clients tab waits for selected pharmacy instead of showing premature access error', () => {
  const detail = read(detailPath);

  const clientsBranch =
    detail
      .split("visibleTab === 'clients' ? (")[1]
      ?.split("pharmacy && ['orders', 'products']")[0] ?? '';

  assert.match(clientsBranch, /selectionInvalid \? \(/);

  assert.match(
    clientsBranch,
    /selectionLoading \|\| selectedId !== pharmacyId \? \(/
  );

  assert.doesNotMatch(
    clientsBranch,
    /!selectionLoading && selectedId !== pharmacyId/
  );

  assert.match(clientsBranch, /<ClientsTable clients=\{\[\]\} isLoading/);
});

//===================================================================

test('mobile Clients header stays visible while statistics are hidden', () => {
  const page = read(pagePath);

  const css = read(
    'components/clients/ClientsPageContent/ClientsPageContent.module.css'
  );

  assert.match(page, /<PageHeader[\s\S]*?titleId="clients-page-title"/);
  assert.match(page, /<div className=\{css.statisticsBody\}>/);

  assert.match(
    css,
    /\.ownerStatisticsCard \.statisticsBody\s*\{\s*display: none;/
  );

  assert.doesNotMatch(css, /\.ownerStatisticsCard\s*\{\s*display: none;/);

  assert.match(
    css,
    /\.embeddedStatisticsCard,\s*\.ownerStatisticsCard \.statisticsBody/
  );
});
