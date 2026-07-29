import assert from 'node:assert/strict';
import test from 'node:test';

import { AuthRequestManager } from './auth-request-manager';

//===================================================================

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;

  const promise = new Promise<T>((nextResolve, nextReject) => {
    resolve = nextResolve;
    reject = nextReject;
  });

  return { promise, resolve, reject };
}

//===================================================================

test('single-flight is scoped to one manager lifecycle', async () => {
  const manager = new AuthRequestManager();
  const deferred = createDeferred<string>();
  let calls = 0;

  const first = manager.start(
    'current-user',
    () => {
      calls += 1;
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

  assert.equal(first, second);
  await Promise.resolve();
  assert.equal(calls, 1);
  deferred.resolve('user');
  assert.equal(await first.promise, 'user');
});

//===================================================================

test('advancing lifecycle aborts an obsolete bootstrap and creates a fresh retry', async () => {
  const manager = new AuthRequestManager();
  const oldRequest = createDeferred<string>();

  const first = manager.start('current-user', () => oldRequest.promise, {
    singleFlight: true,
  });

  manager.advanceLifecycle();

  const second = manager.start('current-user', () => Promise.resolve('fresh'), {
    singleFlight: true,
  });

  assert.equal(first.controller.signal.aborted, true);
  assert.notEqual(first.id, second.id);
  assert.equal(await second.promise, 'fresh');
  assert.equal(manager.isCurrent(first), false);
  assert.equal(manager.isCurrent(second), true);

  oldRequest.resolve('stale');
  assert.equal(await first.promise, 'stale');
  assert.equal(manager.isCurrent(first), false);
});

//===================================================================

test('a newer logout lifecycle makes an older login response obsolete', async () => {
  const manager = new AuthRequestManager();
  const loginRequest = createDeferred<string>();
  const loginAttempt = manager.start('login', () => loginRequest.promise);

  manager.advanceLifecycle();
  const logoutAttempt = manager.start('logout', () => Promise.resolve());

  loginRequest.resolve('old-user');
  await loginAttempt.promise;
  await logoutAttempt.promise;

  assert.equal(loginAttempt.controller.signal.aborted, true);
  assert.equal(manager.isCurrent(loginAttempt), false);
  assert.equal(manager.isCurrent(logoutAttempt), true);
});

//===================================================================

test('a newer login lifecycle is not cleared by an older logout completion', async () => {
  const manager = new AuthRequestManager();
  const logoutRequest = createDeferred<void>();
  const logoutAttempt = manager.start('logout', () => logoutRequest.promise);

  manager.advanceLifecycle();
  const loginAttempt = manager.start('login', () => Promise.resolve('user'));

  assert.equal(await loginAttempt.promise, 'user');
  logoutRequest.resolve();
  await logoutAttempt.promise;

  assert.equal(manager.isCurrent(logoutAttempt), false);
  assert.equal(manager.isCurrent(loginAttempt), true);
});

//===================================================================

test('provider instances with identical service functions stay independent', () => {
  const service = () => Promise.resolve('user');
  const firstManager = new AuthRequestManager();
  const secondManager = new AuthRequestManager();

  const first = firstManager.start('current-user', service, {
    singleFlight: true,
  });
  const second = secondManager.start('current-user', service, {
    singleFlight: true,
  });

  assert.notEqual(first, second);
  firstManager.advanceLifecycle();
  assert.equal(first.controller.signal.aborted, true);
  assert.equal(second.controller.signal.aborted, false);
});
