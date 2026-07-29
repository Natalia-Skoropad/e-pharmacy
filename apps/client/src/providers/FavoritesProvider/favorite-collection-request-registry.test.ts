import assert from 'node:assert/strict';
import test from 'node:test';

import { createFavoriteCollectionRequestRegistry } from './favorite-collection-request-registry';

//===================================================================

test('deduplicates twenty-four card requests into one collection request', async () => {
  const registry = createFavoriteCollectionRequestRegistry();
  let requestCount = 0;

  const requests = Array.from({ length: 24 }, () =>
    registry.load('product', 'session-a', async () => {
      requestCount += 1;
      await Promise.resolve();
      return new Set(['product-a']);
    })
  );

  const results = await Promise.all(requests);

  assert.equal(requestCount, 1);
  assert.equal(results.length, 24);
  assert.equal(results.every((ids) => ids.has('product-a')), true);
});

//===================================================================

test('failed requests are removed so a later card can retry', async () => {
  const registry = createFavoriteCollectionRequestRegistry();
  let requestCount = 0;

  await assert.rejects(
    registry.load('pharmacy', 'session-a', async () => {
      requestCount += 1;
      throw new Error('offline');
    })
  );

  const ids = await registry.load('pharmacy', 'session-a', async () => {
    requestCount += 1;
    return new Set(['pharmacy-a']);
  });

  assert.equal(requestCount, 2);
  assert.equal(ids.has('pharmacy-a'), true);
});

//===================================================================

test('owner change aborts an obsolete collection request', async () => {
  const registry = createFavoriteCollectionRequestRegistry();
  let wasAborted = false;

  const first = registry.load(
    'product',
    'session-a',
    (signal) =>
      new Promise<ReadonlySet<string>>((resolve, reject) => {
        signal.addEventListener(
          'abort',
          () => {
            wasAborted = true;
            reject(signal.reason);
          },
          { once: true }
        );
      })
  );

  const second = registry.load('product', 'session-b', async () => new Set());

  await assert.rejects(first);
  await second;
  assert.equal(wasAborted, true);
});
