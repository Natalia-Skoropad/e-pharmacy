import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

//===================================================================

async function read(relativePath: string): Promise<string> {
  return readFile(
    resolve(process.cwd(), 'src/components/clients', relativePath),
    'utf8'
  );
}

//===================================================================

test('clients list uses one canonical request for rows and statistics without a Walk-in lookup', async () => {
  const source = await read('./ClientsPageContent/ClientsPageContent.tsx');
  const requestMatches = source.match(/getPharmacyClients\(/g) ?? [];

  assert.equal(requestMatches.length, 1);
  assert.match(source, /setClientStatisticsSuccess\(response\.statistics\)/);
  assert.doesNotMatch(source, /name:\s*['"]Walk-in client['"]/);
  assert.doesNotMatch(source, /putDefaultClientFirst/);
  assert.doesNotMatch(source, /getPharmacyClientStatistics/);

  assert.match(
    source,
    /<StatsLoadingSkeleton[\s\S]*?label="Loading client statistics"/
  );

  assert.match(source, /Client statistics are temporarily unavailable/);
  assert.match(source, /counts=\{clientStatistics\}/);
});

//===================================================================

test('client details keep the primary request independent and lazily activate products and comments', async () => {
  const source = await read(
    './ClientDetailsPageContent/ClientDetailsPageContent.tsx'
  );

  const loadClientStart = source.indexOf('async function loadClient()');
  const loadClientEnd = source.indexOf('void loadClient();', loadClientStart);
  const loadClientSource = source.slice(loadClientStart, loadClientEnd);

  assert.match(loadClientSource, /getPharmacyClientDetails\(clientId/);
  assert.doesNotMatch(loadClientSource, /Promise\.all/);
  assert.doesNotMatch(loadClientSource, /getPharmacyOrders/);
  assert.doesNotMatch(loadClientSource, /getPharmacyClientProducts/);
  assert.doesNotMatch(loadClientSource, /getPharmacyNotes/);

  assert.equal((source.match(/getPharmacyOrders\(/g) ?? []).length, 1);
  assert.match(source, /shouldLoadClientProducts\(/);
  assert.match(source, /setLoadedProductsRequestKey\(productsRequestKey\)/);
  assert.match(source, /getPharmacyClientProducts\(/);
  assert.match(source, /activeTab === 'comments' \? \(/);
  assert.doesNotMatch(source, /hidden=\{activeTab !== 'comments'\}/);
  assert.match(source, /getPharmacyNotes\('client', clientId, page, options\)/);
  assert.match(source, /label: 'Comments'/);
  assert.doesNotMatch(source, /commentsTotal/);
  assert.match(source, /mobileVisibleCount=\{1\}/);
  assert.match(source, /tabletVisibleCount=\{5\}/);
});

//===================================================================

test('clientId is a generation boundary that remounts all client-detail local resource state', async () => {
  const source = await read(
    './ClientDetailsPageContent/ClientDetailsPageContent.tsx'
  );

  assert.match(
    source,
    /<ClientDetailsPageContentState\s+key=\{`\$\{props\.clientId\}:\$\{props\.initialTab/
  );

  assert.match(source, /useState<ClientDetailTab>\(initialTab\)/);
  assert.match(source, /parseClientDetailPaginationPath\(pathname, clientId/);
  assert.match(source, /useState\(''\)/);
  assert.match(source, /const controller = new AbortController\(\)/);
  assert.match(source, /controller\.abort\(\)/);
});

//===================================================================

test('deleted purchased products are rendered as history without a broken Product Details link', async () => {
  const source = await read(
    './ClientDetailsPageContent/ClientDetailTableColumns.tsx'
  );

  assert.match(source, /item\.currentProductExists \? \(/);
  assert.match(source, /item\.currentStatus \? \(/);
  assert.match(source, /'Unavailable'/);
  assert.match(source, /item\.firstOrderDate/);
  assert.match(source, /item\.ordersCount/);
  assert.match(source, /First order/);
});

//===================================================================

test('clients list persists selected ID filters in the URL while search text stays local to the searchable select', async () => {
  const source = await read('./ClientsPageContent/ClientsPageContent.tsx');
  const search = await read('./OwnerClientSearch/OwnerClientSearch.tsx');

  assert.match(search, /useDebouncedValue\(query\.trim\(\), 250\)/);
  assert.match(source, /getClientsQueryParams\(\s*filters/);
  assert.match(source, /const routeFilters = useMemo<ClientsFilterState>/);
  assert.match(source, /const canonicalInitialPath = buildClientsPath\(/);
  assert.match(source, /router.push\(nextPath, \{ scroll: false \}\)/);
  assert.doesNotMatch(source, /pendingRoutePathRef/);
  assert.doesNotMatch(source, /pathname !== canonicalInitialPath/);
  assert.match(source, /from: initialFilters\.firstOrderDate\.from/);
  assert.match(source, /to: initialFilters\.firstOrderDate\.to/);
  assert.match(source, /status: initialFilters\.status/);
  assert.match(source, /successfulOrders: initialFilters\.successfulOrders/);
});

//===================================================================

test('client resources keep unavailable state separate from successful empty data and map errors safely', async () => {
  const clientsSource = await read(
    './ClientsPageContent/ClientsPageContent.tsx'
  );

  const detailsSource = await read(
    './ClientDetailsPageContent/ClientDetailsPageContent.tsx'
  );

  const [commentsSource, commentsResourceSource] = await Promise.all([
    read('../comments/EntityComments/EntityComments.tsx'),
    read('../comments/EntityComments/useEntityCommentsResource.ts'),
  ]);

  assert.match(clientsSource, /useState<ResourceStatus>\('idle'\)/);
  assert.match(clientsSource, /getSafeApiErrorMessage\(/);
  assert.match(clientsSource, /clientsStatus === 'error'/);
  assert.match(clientsSource, /useLastKnownStatistics<ClientStatisticsCounts>/);
  assert.doesNotMatch(clientsSource, /DEFAULT_CLIENT_STATISTICS/);
  assert.doesNotMatch(clientsSource, /catch[\s\S]{0,220}setClients\(\[\]\)/);
  assert.match(detailsSource, /const \[ordersStatus, setOrdersStatus\]/);

  const orderStatisticsSource = await read(
    './ClientDetailsPageContent/ClientOrderStatistics.tsx'
  );

  assert.match(detailsSource, /<ClientOrderStatistics clientId=\{clientId\}/);
  assert.match(orderStatisticsSource, /getPharmacyClientOrderStatistics\(/);
  assert.match(orderStatisticsSource, /variant="error"/);
  assert.match(orderStatisticsSource, /StatsLoadingSkeleton/);
  assert.doesNotMatch(detailsSource, /DEFAULT_ORDER_STATISTICS/);
  assert.match(detailsSource, /const \[productsStatus, setProductsStatus\]/);
  assert.match(detailsSource, /getClientDetailsError\(loadError\)/);
  assert.match(detailsSource, /getSafeApiErrorMessage\(/);
  assert.doesNotMatch(detailsSource, /instanceof Error && .*\.message/);
  assert.doesNotMatch(detailsSource, /setOrders\(\[\]\)[\s\S]{0,180}catch/);
  assert.doesNotMatch(detailsSource, /setProducts\(\[\]\)[\s\S]{0,180}catch/);

  assert.match(
    commentsResourceSource,
    /useState<EntityCommentsResourceStatus>\(\s*initialData \? 'success' : 'loading'\s*\)/
  );

  assert.match(commentsSource, /comments\.status === 'success'/);
  assert.match(commentsSource, /getSafeApiErrorMessage\(/);
  assert.doesNotMatch(commentsSource, /instanceof Error && .*\.message/);

  assert.doesNotMatch(
    commentsResourceSource,
    /instanceof Error && .*\.message/
  );
});

//===================================================================

test('client pagination uses canonical backend pages while order statistics have independent owner scope', async () => {
  const source = await read(
    './ClientDetailsPageContent/ClientDetailsPageContent.tsx'
  );

  assert.match(source, /response\.page !== ordersPage/);

  assert.match(
    source,
    /navigateTable\('orders', response\.page, ordersRowsPerPage, true\)/
  );

  assert.match(source, /response\.page !== productsPage/);

  assert.match(
    source,
    /navigateTable\('products', response\.page, productsRowsPerPage, true\)/
  );

  assert.doesNotMatch(
    source,
    /setOrderStatisticsSuccess\(response\.statistics\)/
  );

  assert.match(source, /setOrdersOverallTotal\(response\.total\)/);
  assert.match(source, /<ClientOrderStatistics clientId=\{clientId\}/);
});

//===================================================================

test('client component barrels do not re-export canonical domain types', async () => {
  const tableSource = await read('./ClientsTable/ClientsTable.tsx');
  const barrelSource = await read('./index.ts');

  assert.doesNotMatch(
    tableSource,
    /export\s+type\s*\{[^}]*PharmacyClientRow[^}]*\}/
  );

  assert.doesNotMatch(barrelSource, /PharmacyClientRow/);
  assert.doesNotMatch(barrelSource, /export\s+\*/);
});

//===================================================================

test('client route pages fail closed for malformed entity ids before rendering detail content', async () => {
  const catchAllSource = await read(
    '../../app/pharmacy/clients/[[...filters]]/page.tsx'
  );

  const detailSource = await read(
    '../../app/pharmacy/clients/[clientId]/page.tsx'
  );

  for (const source of [catchAllSource, detailSource]) {
    assert.match(source, /resolveClientsRoute\(/);
    assert.match(
      source,
      /if \(route\.kind === 'invalid'\) \{\s*notFound\(\);\s*\}/
    );
  }

  const pathsSource = await read('../../lib/clients/client-paths.ts');

  assert.match(
    pathsSource,
    /segments\.length === 1 && isValidObjectId\(segments\[0\]\)/
  );
});

//===================================================================

test('client detail text searches debounce network work and reset pagination by debounced generation', async () => {
  const source = await read(
    './ClientDetailsPageContent/ClientDetailsPageContent.tsx'
  );

  assert.match(source, /useDebouncedValue\(orderNumberSearch, 450\)/);
  assert.match(source, /useDebouncedValue\(\s*orderCommentSearch,\s*450\s*\)/);

  assert.match(
    source,
    /useDebouncedValue\(\s*productArticleSearch,\s*450\s*\)/
  );

  assert.match(source, /useDebouncedValue\(productNameSearch, 450\)/);

  assert.match(
    source,
    /orderNumber: debouncedOrderNumberSearch\.trim\(\) \|\| undefined/
  );

  assert.match(
    source,
    /clientComment: debouncedOrderCommentSearch\.trim\(\) \|\| undefined/
  );

  assert.match(
    source,
    /article: debouncedProductArticleSearch\.trim\(\) \|\| undefined/
  );

  assert.match(
    source,
    /name: debouncedProductNameSearch\.trim\(\) \|\| undefined/
  );

  assert.match(source, /const orderSearchKey =/);
  assert.match(source, /const ordersPage = ordersPagination\.page/);
  assert.match(source, /const productSearchKey =/);
  assert.match(source, /const productsPage = productsPagination\.page/);

  const [ordersTab, productsTab] = await Promise.all([
    read('./ClientDetailsPageContent/ClientOrdersTab.tsx'),
    read('./ClientDetailsPageContent/ClientProductsTab.tsx'),
  ]);

  assert.match(ordersTab, /onChange=\{setOrderNumberSearch\}/);
  assert.match(ordersTab, /onChange=\{setOrderCommentSearch\}/);
  assert.match(productsTab, /onChange=\{setProductArticleSearch\}/);
  assert.match(productsTab, /onChange=\{setProductNameSearch\}/);
});

//===================================================================

test('client resources expose explicit local retry controls without clearing last-known-good state', async () => {
  const [listSource, detailsSource] = await Promise.all([
    read('./ClientsPageContent/ClientsPageContent.tsx'),
    read('./ClientDetailsPageContent/ClientDetailsPageContent.tsx'),
  ]);

  assert.match(listSource, /const \[retryVersion, setRetryVersion\]/);
  assert.match(listSource, /Retry clients/);
  assert.match(listSource, /retryVersion/);

  const [orderStats, productTab] = await Promise.all([
    read('./ClientDetailsPageContent/ClientOrderStatistics.tsx'),
    read('./ClientDetailsPageContent/ClientProductsTab.tsx'),
  ]);

  assert.match(detailsSource, /Loading client details/);
  assert.match(detailsSource, /retryLabel="Try again"/);
  assert.match(orderStats, /Client order statistics could not be loaded/);
  assert.match(orderStats, /onRetry/);
  assert.match(productTab, /Retry purchased products/);
  assert.match(detailsSource, /ordersRetryVersion/);
  assert.match(detailsSource, /productsRetryVersion/);
});
