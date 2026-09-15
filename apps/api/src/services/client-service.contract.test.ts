import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

//===================================================================

async function readClientService(): Promise<string> {
  return readFile(
    resolve(process.cwd(), 'src/services/client.service.ts'),
    'utf8'
  );
}

//===================================================================

async function readOrderModel(): Promise<string> {
  return readFile(resolve(process.cwd(), 'src/models/order.model.ts'), 'utf8');
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

test('purchased products stay historical and paginate inside Mongo aggregation', async () => {
  const source = await readClientService();

  const start = source.indexOf(
    'export async function getClientPurchasedProductsService'
  );

  const purchasedProductsSource = source.slice(start);

  const pipelineStart = source.indexOf(
    'function buildClientProductsAggregationPipeline'
  );

  const pipelineSource = source.slice(pipelineStart, start);

  assert.match(
    purchasedProductsSource,
    /Order\.aggregate<ClientPurchasedProductsAggregationResult>/
  );

  assert.match(pipelineSource, /from: Product\.collection\.name/);

  assert.match(
    pipelineSource,
    /photoUrl:\s*\{[\s\S]*productSnapshot\.imageUrl/
  );

  assert.match(pipelineSource, /article: '\$items\.productSnapshot\.article'/);
  assert.match(pipelineSource, /name: '\$items\.productSnapshot\.name'/);

  assert.match(
    pipelineSource,
    /category:\s*\{[\s\S]*productSnapshot\.category[\s\S]*'other'/
  );

  assert.match(pipelineSource, /currentProductExists:/);
  assert.match(pipelineSource, /currentStatus:/);

  assert.match(
    pipelineSource,
    /const itemsFacet: PipelineStage\.FacetPipelineStage\[\]/
  );

  assert.match(pipelineSource, /\{ \$skip: skip \}/);
  assert.match(pipelineSource, /\{ \$limit: query\.perPage \}/);
  assert.match(pipelineSource, /total: totalFacet/);
  assert.match(pipelineSource, /metadata: metadataFacet/);

  assert.doesNotMatch(purchasedProductsSource, /Order\.find\(/);
  assert.doesNotMatch(purchasedProductsSource, /Product\.find\(/);
  assert.doesNotMatch(purchasedProductsSource, /\.slice\(skip/);
  assert.doesNotMatch(pipelineSource, /currentProduct\?\.name/);
  assert.doesNotMatch(pipelineSource, /currentProduct\?\.article/);
});

//===============================================================

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

  assert.match(
    productsSource,
    /const page = totalPages === 0 \? 1 : Math\.min\(query\.page, totalPages\)/
  );

  assert.match(productsSource, /if \(page !== query\.page\)/);
  assert.match(productsSource, /\(page - 1\) \* query\.perPage/);

  assert.match(
    productsSource,
    /buildClientProductsAggregationPipeline\([\s\S]*?\(page - 1\) \* query\.perPage/
  );
});

//===================================================================

test('client purchase history has a compound order index for scoped pagination', async () => {
  const source = await readOrderModel();

  assert.match(
    source,
    /orderSchema\.index\(\{ pharmacyId: 1, userId: 1, status: 1, createdAt: -1 \}\)/
  );
});

//===================================================================

test('default client projection suppresses synthetic contact fields and stays active', async () => {
  const source = await readClientService();
  const rowsStart = source.indexOf('async function getClientRowsForPharmacy(');

  const rowsEnd = source.indexOf(
    '//===============================================================',
    rowsStart + 10
  );

  const rowsSource = source.slice(rowsStart, rowsEnd);

  assert.match(
    rowsSource,
    /email: \{ \$cond: \['\$isDefault', '', '\$user\.email'\] \}/
  );

  assert.match(
    rowsSource,
    /phone: \{ \$cond: \['\$isDefault', '', '\$user\.phone'\] \}/
  );

  assert.match(
    rowsSource,
    /address:\s*\{[\s\S]*?\$cond:\s*\[\s*'\$isDefault',\s*'',/
  );

  assert.match(
    rowsSource,
    /status:\s*\{[\s\S]*?\$cond:\s*\[\s*'\$isDefault',\s*'active',/
  );
});
