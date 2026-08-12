import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

//===============================================================

test('pharmacy-group removal is one backend cart mutation and is idempotent', async () => {
  const source = await readFile(
    resolve(process.cwd(), 'src/services/cart.service.ts'),
    'utf8'
  );

  const start = source.indexOf(
    'export async function removeCartPharmacyService'
  );

  const end = source.indexOf(
    'export async function removeCartProductOfferService'
  );

  const operation = source.slice(start, end);

  assert.notEqual(start, -1);
  assert.notEqual(end, -1);
  assert.match(operation, /ProductOffer\.find\(/);

  assert.match(
    operation,
    /replaceCartItemsOrThrow\(cart, nextItems, session\)/
  );

  assert.equal(
    (operation.match(/replaceCartItemsOrThrow\(/g) ?? []).length,
    1,
    'The whole pharmacy group must be removed by one cart write.'
  );

  assert.match(operation, /if \(offerIds\.size === 0\) return;/);

  assert.match(
    operation,
    /if \(nextItems\.length === cart\.items\.length\) return;/
  );
});
