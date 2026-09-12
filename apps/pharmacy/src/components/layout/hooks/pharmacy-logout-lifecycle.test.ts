import assert from 'node:assert/strict';
import test from 'node:test';

import { runPharmacyLogoutLifecycle } from './pharmacy-logout-lifecycle';

//===================================================================

test('successful logout settles local UI and performs one login redirect', async () => {
  const calls: string[] = [];
  const lock = { current: false };

  const result = await runPharmacyLogoutLifecycle({
    lock,
    logout: async () => {
      calls.push('logout');
    },

    setPending: (pending) => calls.push(`pending:${pending}`),
    onSettled: () => calls.push('close'),
    navigateToLogin: () => calls.push('redirect'),
  });

  assert.equal(result, true);

  assert.deepEqual(calls, [
    'pending:true',
    'logout',
    'close',
    'redirect',
    'pending:false',
  ]);

  assert.equal(lock.current, false);
});

//===================================================================

test('remote logout failure still closes and redirects to login', async () => {
  const calls: string[] = [];
  const lock = { current: false };

  await runPharmacyLogoutLifecycle({
    lock,
    logout: async () => {
      calls.push('logout');
      throw new Error('network');
    },

    setPending: (pending) => calls.push(`pending:${pending}`),
    onSettled: () => calls.push('close'),
    navigateToLogin: () => calls.push('redirect'),
  });

  assert.deepEqual(calls, [
    'pending:true',
    'logout',
    'close',
    'redirect',
    'pending:false',
  ]);

  assert.equal(lock.current, false);
});

//===================================================================

test('second concurrent logout is rejected before another request starts', async () => {
  let releaseLogout!: () => void;
  let logoutCalls = 0;
  let redirects = 0;
  const lock = { current: false };

  const pending = new Promise<void>((resolve) => {
    releaseLogout = resolve;
  });

  const options = {
    lock,
    logout: async () => {
      logoutCalls += 1;
      await pending;
    },

    setPending: () => undefined,
    navigateToLogin: () => {
      redirects += 1;
    },
  };

  const first = runPharmacyLogoutLifecycle(options);
  const second = await runPharmacyLogoutLifecycle(options);

  assert.equal(second, false);
  assert.equal(logoutCalls, 1);
  assert.equal(redirects, 0);

  releaseLogout();
  assert.equal(await first, true);
  assert.equal(redirects, 1);
});
