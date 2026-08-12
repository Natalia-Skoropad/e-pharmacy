import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

//===================================================================

test('cart mutations refresh authoritative state after multi-tab conflicts', async () => {
  const source = await readFile(
    path.resolve(process.cwd(), 'src/providers/CartProvider/CartProvider.tsx'),
    'utf8'
  );

  assert.match(source, /recoverAuthoritativeCartAfterConflict/);
  assert.match(source, /CART_CHANGED_ERROR_CODE/);
  assert.match(source, /STOCK_CHANGED_ERROR_CODE/);
  assert.match(source, /await getCart\(\{ signal \}\)/);

  assert.doesNotMatch(
    source,
    /catch \(error\) \{[\s\S]{0,120}replaceCartFromServer\(previousCart\)/
  );

  const recoveryCalls =
    source.match(/recoverAuthoritativeCartAfterConflict\(/g) ?? [];
  assert.ok(
    recoveryCalls.length >= 5,
    'all cart write paths must use conflict recovery'
  );
});
