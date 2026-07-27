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

test('timeout aborts the concrete attempt and a late result stays obsolete', async () => {
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
