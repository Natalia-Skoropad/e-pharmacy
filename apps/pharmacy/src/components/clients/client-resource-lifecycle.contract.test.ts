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
  assert.match(source, /setClientStatistics\(response\.statistics\)/);
  assert.doesNotMatch(source, /name:\s*['"]Walk-in client['"]/);
  assert.doesNotMatch(source, /putDefaultClientFirst/);
  assert.doesNotMatch(source, /getPharmacyClientStatistics/);
  assert.doesNotMatch(source, /Loading client statistics/);
  assert.match(source, /counts=\{clientStatistics\}/);
});

//===================================================================

test('client details keep the primary client request independent while preloading product and comment counts', async () => {
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
  assert.doesNotMatch(source, /productsActivated/);
  assert.doesNotMatch(source, /commentsActivated/);
  assert.match(source, /getPharmacyClientProducts\(/);
  assert.match(source, /getPharmacyNotes\('client', clientId, page, options\)/);
  assert.match(source, /commentsTotal === null\s*\? 'Comments'/);
  assert.match(source, /initialTotal=\{commentsTotal \?\? undefined\}/);
});

//===================================================================

test('clientId is a generation boundary that remounts all client-detail local resource state', async () => {
  const source = await read(
    './ClientDetailsPageContent/ClientDetailsPageContent.tsx'
  );

  assert.match(
    source,
    /<ClientDetailsPageContentState key=\{props\.clientId\} \{\.\.\.props\} \/>/
  );

  assert.match(source, /useState<ClientTab>\('details'\)/);
  assert.match(source, /page:\s*1/);
  assert.match(source, /useState\(''\)/);
  assert.match(source, /const controller = new AbortController\(\)/);
  assert.match(source, /controller\.abort\(\)/);
});

//===================================================================

test('deleted purchased products are rendered as history without a broken Product Details link', async () => {
  const source = await read(
    './ClientDetailsPageContent/ClientDetailsPageContent.tsx'
  );

  assert.match(source, /item\.currentProductExists \? \(/);
  assert.match(source, /item\.currentStatus \? \(/);
  assert.match(source, /'Unavailable'/);
  assert.match(source, /item\.firstOrderDate/);
  assert.match(source, /item\.ordersCount/);
  assert.match(source, /First order/);
});

//===================================================================

test('clients list debounces PII search requests while route-owned filters resync from navigation', async () => {
  const source = await read('./ClientsPageContent/ClientsPageContent.tsx');

  assert.match(source, /const \[searchFilters, setSearchFilters\] = useState/);
  assert.match(source, /useDebouncedValue\(searchFilters, 450\)/);
  assert.match(source, /getClientsQueryParams\(requestFilters/);
  assert.match(source, /const routeFilters = useMemo<ClientsFilterState>/);
  assert.match(source, /buildClientsPath\(routeFilters\)/);
  assert.match(source, /pendingRoutePathRef/);
  assert.match(source, /pathname !== canonicalInitialPath/);
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
  assert.doesNotMatch(clientsSource, /catch[\s\S]{0,220}setClients\(\[\]\)/);

  assert.match(detailsSource, /const \[ordersStatus, setOrdersStatus\]/);
  assert.match(detailsSource, /const \[productsStatus, setProductsStatus\]/);
  assert.match(detailsSource, /getClientDetailsError\(loadError\)/);
  assert.match(detailsSource, /getSafeApiErrorMessage\(/);
  assert.doesNotMatch(detailsSource, /instanceof Error && .*\.message/);
  assert.doesNotMatch(detailsSource, /setOrders\(\[\]\)[\s\S]{0,180}catch/);
  assert.doesNotMatch(detailsSource, /setProducts\(\[\]\)[\s\S]{0,180}catch/);

  assert.match(
    commentsResourceSource,
    /useState<EntityCommentsResourceStatus>\(\s*'loading'\s*\)/
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

test('client detail pagination accepts canonical backend pages and order statistics follow each successful filtered response', async () => {
  const source = await read(
    './ClientDetailsPageContent/ClientDetailsPageContent.tsx'
  );

  assert.match(
    source,
    /setOrdersPageState\(\{[\s\S]*?searchKey: orderSearchKey,[\s\S]*?page: response\.page,[\s\S]*?\}\)/
  );

  assert.match(
    source,
    /setProductsPageState\(\{[\s\S]*?searchKey: productSearchKey,[\s\S]*?page: response\.page,[\s\S]*?\}\)/
  );

  assert.match(source, /setOrderStatistics\(response\.statistics\)/);

  assert.match(
    source,
    /if \(!hasSearchOrFilters\) \{\s*setOrdersOverallTotal\(response\.total\);\s*\}\s*setOrderStatistics\(response\.statistics\)/
  );
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

test('client route pages reject mixed segments while single invalid ids render branded detail errors', async () => {
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
  assert.match(pathsSource, /if \(segments\.length === 1\) \{/);
  assert.doesNotMatch(pathsSource, /segments\.length === 1 && isValidObjectId/);
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
  assert.match(source, /ordersPageState\.searchKey === orderSearchKey/);
  assert.match(source, /const productSearchKey =/);
  assert.match(source, /productsPageState\.searchKey === productSearchKey/);

  assert.match(source, /onChange=\{setOrderNumberSearch\}/);
  assert.match(source, /onChange=\{setOrderCommentSearch\}/);
  assert.match(source, /onChange=\{setProductArticleSearch\}/);
  assert.match(source, /onChange=\{setProductNameSearch\}/);
});
