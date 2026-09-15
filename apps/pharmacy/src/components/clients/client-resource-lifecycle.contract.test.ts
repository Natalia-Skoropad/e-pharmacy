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
});

//===================================================================

test('client details keep the primary client request independent and lazy-load supporting products and comments', async () => {
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
  assert.match(source, /if \(!productsActivated\) return;/);

  assert.match(
    source,
    /if \(nextTab === 'products'\) setProductsActivated\(true\)/
  );

  assert.match(
    source,
    /if \(nextTab === 'comments'\) setCommentsActivated\(true\)/
  );

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
  assert.match(source, /useState\(1\)/);
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
});
