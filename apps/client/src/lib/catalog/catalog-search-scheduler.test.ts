import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createCatalogSearchScheduler,
  hasCommittedCatalogSearchChanged,
} from './catalog-search-scheduler';

//===================================================================

const wait = (milliseconds: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

//===================================================================

test('rapid typing commits only the latest draft', async () => {
  const scheduler = createCatalogSearchScheduler<string>();
  const committed: string[] = [];

  scheduler.schedule('first', 10, (value) => committed.push(value));
  scheduler.schedule('second', 10, (value) => committed.push(value));
  scheduler.schedule('latest', 10, (value) => committed.push(value));

  await wait(25);
  assert.deepEqual(committed, ['latest']);
});

//===================================================================

test('reset or unmount cancels a stale pending search', async () => {
  const scheduler = createCatalogSearchScheduler<string>();
  const committed: string[] = [];

  scheduler.schedule('stale search', 10, (value) => committed.push(value));
  scheduler.cancel();

  await wait(25);
  assert.deepEqual(committed, []);
});

//===================================================================

test('a later search can be scheduled after cancellation', async () => {
  const scheduler = createCatalogSearchScheduler<string>();
  const committed: string[] = [];

  scheduler.schedule('cancelled', 10, (value) => committed.push(value));
  scheduler.cancel();
  scheduler.schedule('current', 10, (value) => committed.push(value));

  await wait(25);
  assert.deepEqual(committed, ['current']);
});

//===================================================================

test('detects committed route changes from Back or server navigation', () => {
  assert.equal(
    hasCommittedCatalogSearchChanged('{"name":"old"}', '{"name":"new"}'),
    true
  );

  assert.equal(
    hasCommittedCatalogSearchChanged('{"name":"same"}', '{"name":"same"}'),
    false
  );
});

//===================================================================

test('cleanup remains idempotent under Strict Mode effect replay', () => {
  const scheduler = createCatalogSearchScheduler<string>();
  scheduler.schedule('stale', 10, () => undefined);
  scheduler.cancel();
  scheduler.cancel();
});
