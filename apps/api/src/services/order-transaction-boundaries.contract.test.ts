import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

//===============================================================

const servicePath = path.resolve(
  process.cwd(),
  'src/services/order.service.ts'
);

//===============================================================

test('checkout and pharmacy edits keep cart, order and stock inside Mongo transactions', async () => {
  const source = await readFile(servicePath, 'utf8');

  const checkoutStart = source.indexOf(
    'export async function checkoutOrderService'
  );

  const updateStart = source.indexOf(
    'export async function updateOrderDetailsService'
  );

  assert.notEqual(checkoutStart, -1);
  assert.notEqual(updateStart, -1);

  const checkoutSource = source.slice(checkoutStart, updateStart);
  assert.match(checkoutSource, /session\.withTransaction/);
  assert.match(checkoutSource, /reserveOfferStock/);
  assert.match(checkoutSource, /Order\.create/);
  assert.match(checkoutSource, /expectedCartRevision/);
  assert.match(checkoutSource, /groupFingerprint/);

  const updateSource = source.slice(updateStart);
  assert.match(updateSource, /session\.withTransaction/);
  assert.match(updateSource, /reserveOfferStock/);
  assert.match(updateSource, /releaseOfferStock/);
  assert.match(updateSource, /commitReservedStock/);
});
