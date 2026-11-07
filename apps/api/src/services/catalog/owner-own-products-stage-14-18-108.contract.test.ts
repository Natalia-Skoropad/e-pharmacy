import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

//===================================================================

const read = (path: string) => readFile(resolve(process.cwd(), path), 'utf8');

//===================================================================

test('owner inventory authorization never accepts an unrelated pharmacy', async () => {
  const management = await read(
    'src/services/catalog/product-management.service.ts'
  );

  assert.match(management, /if \(query\.ownerProducts\)/);
  assert.match(management, /await assertOwnerCatalogAccess\(actor\.userId\)/);

  assert.match(
    management,
    /Pharmacy\.distinct\('_id', \{ ownerId: actor\.userId \}\)/
  );

  assert.match(management, /!pharmacyIds\.includes\(query\.pharmacyId\)/);
  assert.match(management, /offerVisibility: \{\s*mode: 'owner-management'/);
});

//===================================================================

test('server restricts product and stock queries to the owner offer allow-list', async () => {
  const shared = await read('src/services/catalog/product-shared.ts');

  assert.match(shared, /if \(options\.ownedPharmacyIds\)/);
  assert.match(shared, /ProductOffer\.distinct\('productId'/);

  assert.match(
    shared,
    /applyProductIdIncludeFilter\(filter, ownedProductIds\)/
  );

  assert.match(
    shared,
    /getOwnProductStatistics\(query\.pharmacyId \? \[query\.pharmacyId\]/
  );
});

//===================================================================

test('new query option validates and never changes public query shape', async () => {
  const schema = await read('src/schemas/catalog/product.schema.ts');

  assert.match(schema, /ownerProducts: booleanQuerySchema\.optional\(\)/);
  assert.match(schema, /publicProductsQuerySchema = z\.preprocess/);
});
