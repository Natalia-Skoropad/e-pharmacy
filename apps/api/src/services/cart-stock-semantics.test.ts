import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

//===================================================================

test('cart mutations do not reserve, release or commit stock', async () => {
  const source = await readFile(
    resolve(process.cwd(), 'src/services/cart.service.ts'),
    'utf8'
  );

  for (const stockMutation of [
    'reserveOfferStock',
    'releaseOfferStock',
    'commitReservedStock',
    'restoreCommittedStock',
  ]) {
    assert.equal(source.includes(stockMutation), false);
  }
});
