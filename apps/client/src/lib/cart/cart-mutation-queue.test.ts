import assert from 'node:assert/strict';
import test from 'node:test';

import { createCartMutationQueue } from './cart-mutation-queue';

//===================================================================

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;

  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return { promise, resolve, reject };
}

//===================================================================

test('serializes cart writes so operation B cannot finish before A', async () => {
  const queue = createCartMutationQueue();
  const firstGate = deferred<void>();
  const order: string[] = [];

  const first = queue.enqueue(async () => {
    order.push('A:start');
    await firstGate.promise;
    order.push('A:end');
    return 'A';
  });

  const second = queue.enqueue(async () => {
    order.push('B:start');
    order.push('B:end');
    return 'B';
  });

  await Promise.resolve();
  assert.deepEqual(order, ['A:start']);

  firstGate.resolve();

  assert.equal(await first, 'A');
  assert.equal(await second, 'B');
  assert.deepEqual(order, ['A:start', 'A:end', 'B:start', 'B:end']);
});

//===================================================================

test('closing the session aborts the active write and drops queued writes', async () => {
  const queue = createCartMutationQueue();
  const started = deferred<void>();

  const active = queue.enqueue(
    (signal) =>
      new Promise<string>((resolve, reject) => {
        started.resolve();
        signal.addEventListener(
          'abort',
          () => reject(signal.reason ?? new DOMException('Aborted', 'AbortError')),
          { once: true }
        );
      })
  );

  const queued = queue.enqueue(async () => 'queued');

  await started.promise;
  queue.close(new DOMException('Session changed', 'AbortError'));

  assert.equal(await active, null);
  assert.equal(await queued, null);
  assert.equal(queue.isClosed(), true);
});

//===================================================================

test('close settles an active task even when the task ignores AbortSignal', async () => {
  const queue = createCartMutationQueue();
  const started = deferred<void>();

  const result = queue.enqueue(async () => {
    started.resolve();
    await new Promise(() => undefined);
    return 'never';
  });

  await started.promise;
  queue.close();

  assert.equal(await result, null);
  assert.equal(await queue.enqueue(async () => 'late'), null);
  queue.close();
  assert.equal(queue.isClosed(), true);
});

test('a rejected task does not block the next queued task', async () => {
  const queue = createCartMutationQueue();

  await assert.rejects(queue.enqueue(async () => {
    throw new Error('failed');
  }));

  assert.equal(await queue.enqueue(async () => 'next'), 'next');
});
