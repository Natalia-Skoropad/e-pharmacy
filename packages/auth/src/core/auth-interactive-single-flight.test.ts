import assert from 'node:assert/strict';
import test from 'node:test';

import {
  AuthInteractiveSingleFlight,
  createAuthInteractiveRequestKey,
} from './auth-interactive-single-flight';

//===================================================================

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((nextResolve) => {
    resolve = nextResolve;
  });
  return { promise, resolve };
}

//===================================================================

test('identical double submit shares one interactive server operation', async () => {
  const singleFlight = new AuthInteractiveSingleFlight();
  const deferred = createDeferred<string>();
  const key = createAuthInteractiveRequestKey({
    email: 'client@example.com',
    password: 'secret-password',
    application: 'client',
  });

  let calls = 0;

  const first = singleFlight.run('login', key, () => {
    calls += 1;
    return deferred.promise;
  });

  const second = singleFlight.run('login', key, () => {
    calls += 1;
    return Promise.resolve('unexpected');
  });

  assert.equal(first, second);
  await Promise.resolve();
  assert.equal(calls, 1);

  deferred.resolve('user');
  assert.equal(await first, 'user');
  assert.equal(await second, 'user');
});

//===================================================================

test('different interactive payload supersedes rather than deduplicates', async () => {
  const singleFlight = new AuthInteractiveSingleFlight();
  const firstDeferred = createDeferred<string>();

  const first = singleFlight.run(
    'login',
    createAuthInteractiveRequestKey({ email: 'a@example.com' }),
    () => firstDeferred.promise
  );

  const second = singleFlight.run(
    'login',
    createAuthInteractiveRequestKey({ email: 'b@example.com' }),
    () => Promise.resolve('second')
  );

  assert.notEqual(first, second);
  assert.equal(await second, 'second');

  firstDeferred.resolve('first');
  assert.equal(await first, 'first');
});

//===================================================================

test('login and register flights are independent', async () => {
  const singleFlight = new AuthInteractiveSingleFlight();

  const login = singleFlight.run('login', 'same', () =>
    Promise.resolve('login')
  );

  const register = singleFlight.run('register', 'same', () =>
    Promise.resolve('register')
  );

  assert.equal(await login, 'login');
  assert.equal(await register, 'register');
});
