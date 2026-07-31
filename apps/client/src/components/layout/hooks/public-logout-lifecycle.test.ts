import assert from 'node:assert/strict';
import test from 'node:test';

import { runPublicLogoutLifecycle } from './public-logout-lifecycle';

//===================================================================

test('runs logout once and completes close/navigation lifecycle', async () => {
  const calls: string[] = [];
  const lock = { current: false };

  const result = await runPublicLogoutLifecycle({
    lock,

    logout: async () => {
      calls.push('logout');
    },

    setPending: (pending) => calls.push(`pending:${pending}`),
    onSettled: () => calls.push('close'),
    navigateHome: () => calls.push('navigate'),
    reportRemoteFailure: () => calls.push('report'),
  });

  assert.equal(result, true);

  assert.deepEqual(calls, [
    'pending:true',
    'logout',
    'close',
    'navigate',
    'pending:false',
  ]);

  assert.equal(lock.current, false);
});

//===================================================================

test('remote failure still closes and navigates with a non-blocking report', async () => {
  const calls: string[] = [];
  const lock = { current: false };

  await runPublicLogoutLifecycle({
    lock,

    logout: async () => {
      calls.push('logout');
      throw new Error('network');
    },

    setPending: (pending) => calls.push(`pending:${pending}`),
    onSettled: () => calls.push('close'),
    navigateHome: () => calls.push('navigate'),
    reportRemoteFailure: () => calls.push('report'),
  });

  assert.deepEqual(calls, [
    'pending:true',
    'logout',
    'report',
    'close',
    'navigate',
    'pending:false',
  ]);
});

//===================================================================

test('rejects a second concurrent logout before another request starts', async () => {
  let releaseLogout!: () => void;
  let logoutCalls = 0;
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
    navigateHome: () => undefined,
    reportRemoteFailure: () => undefined,
  };

  const first = runPublicLogoutLifecycle(options);
  const second = await runPublicLogoutLifecycle(options);

  assert.equal(second, false);
  assert.equal(logoutCalls, 1);

  releaseLogout();
  assert.equal(await first, true);
});
