import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

//===================================================================

test('product offer add/remove mutations keep relation checks and writes in transactions', async () => {
  const source = await readFile(
    resolve(process.cwd(), 'src/services/product.service.ts'),
    'utf8'
  );

  const addStart = source.indexOf(
    'export async function addProductToMyPharmacyService'
  );

  const removeStart = source.indexOf(
    'export async function removeProductFromMyPharmacyService'
  );

  const addSource = source.slice(addStart, removeStart);

  const removeSource = source.slice(
    removeStart,
    source.indexOf(
      '//===============================================================',
      removeStart + 100
    )
  );

  assert.match(addSource, /mongoose\.startSession\(\)/);
  assert.match(addSource, /session\.withTransaction/);
  assert.match(addSource, /ProductOffer\.create\([\s\S]*?\{ session \}/);
  assert.match(addSource, /recordInitialStockArrival\([\s\S]*?session\s*\)/);
  assert.match(addSource, /isDuplicateProductOfferError/);
  assert.match(addSource, /PRODUCT_MANAGEMENT_ERROR_CODES\.ALREADY_ADDED/);

  assert.match(removeSource, /mongoose\.startSession\(\)/);
  assert.match(removeSource, /session\.withTransaction/);
  assert.match(removeSource, /Order\.exists\([\s\S]*?\.session\(session\)/);

  assert.match(
    removeSource,
    /ProductOffer\.deleteOne\(\{ _id: offer\._id \}, \{ session \}\)/
  );

  assert.match(
    removeSource,
    /PRODUCT_MANAGEMENT_ERROR_CODES\.HAS_RELATED_ORDERS/
  );
});
