import assert from 'node:assert/strict';
import test from 'node:test';

import { waitForAuthAttempt } from './auth-attempt-timeout';
import { AuthRequestManager } from './auth-request-manager';

//===================================================================

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((nextResolve) => {
    resolve = nextResolve;
  });
  return { promise, resolve };
}

//===================================================================

test('current-user bootstrap is single-flight and receives a cancellable signal', async () => {
  const manager = new AuthRequestManager();
  const deferred = createDeferred<string>();
  let receivedSignal: AbortSignal | null = null;
  let calls = 0;

  const first = manager.start(
    'current-user',
    (signal) => {
      calls += 1;
      receivedSignal = signal;
      return deferred.promise;
    },
    { singleFlight: true }
  );

  const second = manager.start(
    'current-user',
    () => {
      calls += 1;
      return Promise.resolve('unexpected');
    },
    { singleFlight: true }
  );

  await Promise.resolve();

  assert.equal(first, second);
  assert.equal(calls, 1);
  assert.equal(receivedSignal, first.controller.signal);
  assert.equal(first.controller.signal.aborted, false);

  deferred.resolve('user');
  assert.equal(await first.promise, 'user');
});

//===================================================================

test('advancing the auth lifecycle aborts stale work and permits a fresh bootstrap', async () => {
  const manager = new AuthRequestManager();
  const staleRequest = createDeferred<string>();

  const staleAttempt = manager.start(
    'current-user',
    () => staleRequest.promise,
    { singleFlight: true }
  );

  manager.advanceLifecycle();

  const freshAttempt = manager.start(
    'current-user',
    () => Promise.resolve('fresh-user'),
    { singleFlight: true }
  );

  assert.equal(staleAttempt.controller.signal.aborted, true);
  assert.equal(manager.isCurrent(staleAttempt), false);
  assert.equal(await freshAttempt.promise, 'fresh-user');
  assert.equal(manager.isCurrent(freshAttempt), true);

  staleRequest.resolve('stale-user');
  assert.equal(await staleAttempt.promise, 'stale-user');
  assert.equal(manager.isCurrent(staleAttempt), false);
});

//===================================================================

test('bootstrap timeout cancels the active attempt and ignores its late response', async () => {
  const manager = new AuthRequestManager();
  const deferred = createDeferred<string>();
  const attempt = manager.start('current-user', () => deferred.promise);

  const outcome = await waitForAuthAttempt(attempt, 5, () => {
    manager.cancel(attempt);
  });

  assert.deepEqual(outcome, { type: 'timeout' });
  assert.equal(attempt.controller.signal.aborted, true);
  assert.equal(manager.isCurrent(attempt), false);

  deferred.resolve('late-user');
  assert.equal(await attempt.promise, 'late-user');
  assert.equal(manager.isCurrent(attempt), false);
});
