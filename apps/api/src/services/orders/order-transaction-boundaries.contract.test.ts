import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

//===============================================================

const servicePath = (name: string) =>
  path.resolve(process.cwd(), 'src/services/orders', name);

//===============================================================

test('checkout and pharmacy edits keep cart, order and stock inside Mongo transactions', async () => {
  const checkoutSource = await readFile(
    servicePath('order-checkout.service.ts'),
    'utf8'
  );

  const updateSource = await readFile(
    servicePath('order-mutations.service.ts'),
    'utf8'
  );

  assert.match(checkoutSource, /session\.withTransaction/);
  assert.match(checkoutSource, /reserveOfferStock/);
  assert.match(checkoutSource, /Order\.create/);
  assert.match(checkoutSource, /expectedCartRevision/);
  assert.match(checkoutSource, /groupFingerprint/);

  assert.match(updateSource, /session\.withTransaction/);
  assert.match(updateSource, /reserveOfferStock/);
  assert.match(updateSource, /releaseOfferStock/);
  assert.match(updateSource, /commitReservedStock/);
});
