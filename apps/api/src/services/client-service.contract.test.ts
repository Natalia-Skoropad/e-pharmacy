import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

//===================================================================

async function readClientService(): Promise<string> {
  return readFile(resolve(__dirname, 'client.service.ts'), 'utf8');
}

//===================================================================

test('client list derives canonical metrics before applying first-order filters', async () => {
  const source = await readClientService();
  const rowsStart = source.indexOf('async function getClientRowsForPharmacy(');

  const rowsEnd = source.indexOf(
    '//===============================================================',
    rowsStart + 10
  );

  const rowsSource = source.slice(rowsStart, rowsEnd);

  assert.match(source, /match\.firstOrderAt\s*=\s*\{/);
  assert.doesNotMatch(rowsSource, /orderFilter\.createdAt/);
  assert.doesNotMatch(rowsSource, /Order\.find\(/);
  assert.match(rowsSource, /firstOrderAt:\s*\{ \$min: '\$createdAt' \}/);
  assert.match(rowsSource, /successfulOrdersCount:/);
  assert.match(rowsSource, /successfulOrdersAmount:/);
  assert.match(rowsSource, /\$facet:/);
});

//===================================================================

test('client list pagination and statistics stay inside one Mongo aggregation', async () => {
  const source = await readClientService();
  const rowsStart = source.indexOf('async function getClientRowsForPharmacy(');

  const rowsEnd = source.indexOf(
    '//===============================================================',
    rowsStart + 10
  );

  const rowsSource = source.slice(rowsStart, rowsEnd);

  assert.match(
    rowsSource,
    /Order\.aggregate<ClientAggregationResult>\(pipeline\)/
  );

  assert.match(
    rowsSource,
    /const itemsFacet: PipelineStage\.FacetPipelineStage\[\] = \[/
  );

  assert.match(rowsSource, /\{ \$skip: skip \}/);
  assert.match(rowsSource, /\{ \$limit: query\.perPage \}/);

  assert.match(
    rowsSource,
    /const statisticsFacet: PipelineStage\.FacetPipelineStage\[\] = \[/
  );

  assert.match(rowsSource, /items:\s*itemsFacet/);
  assert.match(rowsSource, /total:\s*totalFacet/);
  assert.match(rowsSource, /statistics:\s*statisticsFacet/);
  assert.doesNotMatch(rowsSource, /\.slice\(skip/);
  assert.doesNotMatch(rowsSource, /\.lean<OrderDocument\[\]>/);
});

//===================================================================

test('purchased products use immutable order snapshots and expose current product metadata separately', async () => {
  const source = await readClientService();
  const start = source.indexOf(
    'export async function getClientPurchasedProductsService'
  );
  const purchasedProductsSource = source.slice(start);

  assert.match(purchasedProductsSource, /\.select\('status'\)/);

  assert.match(
    purchasedProductsSource,
    /photoUrl: snapshot\.imageUrl \?\? null/
  );

  assert.match(purchasedProductsSource, /article: snapshot\.article/);
  assert.match(purchasedProductsSource, /name: snapshot\.name/);

  assert.match(
    purchasedProductsSource,
    /category: snapshot\.category \?\? 'other'/
  );

  assert.match(
    purchasedProductsSource,
    /currentProductExists: Boolean\(product\)/
  );

  assert.match(
    purchasedProductsSource,
    /currentStatus: product\?\.status \?\? null/
  );

  assert.doesNotMatch(purchasedProductsSource, /product\?\.name \?\?/);
  assert.doesNotMatch(purchasedProductsSource, /product\?\.article \?\?/);
});

//===================================================================

test('Walk-in identity is flag-based and never inferred from the display name', async () => {
  const source = await readClientService();

  assert.match(
    source,
    /isDefault:\s*\{ \$eq: \['\$user\.isDefaultPharmacyClient', true\] \}/
  );

  assert.doesNotMatch(source, /name\.trim\(\)\.toLowerCase\(\)/);
  assert.doesNotMatch(source, /name\.toLowerCase\(\)/);
});

//===================================================================

test('client and purchased-product pagination clamp stale requested pages before returning data', async () => {
  const source = await readClientService();

  const clientsStart = source.indexOf(
    'export async function getClientsService'
  );

  const clientByIdStart = source.indexOf(
    'export async function getClientByIdService',
    clientsStart
  );

  const clientsSource = source.slice(clientsStart, clientByIdStart);

  assert.match(
    clientsSource,
    /page = totalPages === 0 \? 1 : Math\.min\(query\.page, totalPages\)/
  );

  assert.match(clientsSource, /if \(page !== query\.page\)/);

  assert.match(
    clientsSource,
    /getClientRowsForPharmacy\(pharmacyId, \{ \.\.\.query, page \}\)/
  );

  const productsStart = source.indexOf(
    'export async function getClientPurchasedProductsService'
  );

  const productsSource = source.slice(productsStart);

  assert.match(productsSource, /const total = rows\.length/);

  assert.match(
    productsSource,
    /const page = totalPages === 0 \? 1 : Math\.min\(query\.page, totalPages\)/
  );

  assert.match(productsSource, /const skip = \(page - 1\) \* query\.perPage/);
});
