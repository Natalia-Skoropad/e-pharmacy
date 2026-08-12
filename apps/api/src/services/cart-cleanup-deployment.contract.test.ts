import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

//===============================================================

test('cart reads clean their own stale items while global cleanup is deployment-owned', async () => {
  const [cartSource, serverSource, cleanupScript] = await Promise.all([
    readFile(
      path.resolve(process.cwd(), 'src/services/cart.service.ts'),
      'utf8'
    ),

    readFile(path.resolve(process.cwd(), 'src/server.ts'), 'utf8'),

    readFile(
      path.resolve(process.cwd(), 'src/scripts/cleanup-expired-cart-items.ts'),
      'utf8'
    ),
  ]);

  assert.match(cartSource, /serializeCartWithCleanup/);
  assert.doesNotMatch(cartSource, /lastCartCleanupAt|cartCleanupPromise/);
  assert.doesNotMatch(serverSource, /setInterval|startCartCleanupJob/);
  assert.match(cleanupScript, /runCartCleanupOnce/);
  assert.match(cleanupScript, /mongoose\.disconnect/);
});
