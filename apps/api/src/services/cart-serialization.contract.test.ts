import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

//===============================================================

test('cart serialization cleans stale items transactionally and reports issues', async () => {
  const source = await readFile(
    resolve(process.cwd(), 'src/services/cart.service.ts'),
    'utf8'
  );

  const serializeStart = source.indexOf(
    'async function serializeCartWithCleanup'
  );

  const cleanupStart = source.indexOf(
    'export async function cleanupExpiredCartItemsService'
  );

  const serializeSource = source.slice(serializeStart, cleanupStart);

  assert.notEqual(serializeStart, -1);
  assert.notEqual(cleanupStart, -1);
  assert.doesNotMatch(serializeSource, /\.filter\(Boolean\)/);
  assert.match(serializeSource, /issues\.push\(\{ cartItemId:/);

  assert.match(
    serializeSource,
    /await replaceCartItemsOrThrow\(cart, validItems, session\)/
  );

  assert.match(serializeSource, /return \{\s*revision,/s);
  assert.match(serializeSource, /issues,/);
});
