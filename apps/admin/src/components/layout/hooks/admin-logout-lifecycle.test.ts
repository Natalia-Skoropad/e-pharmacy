import assert from 'node:assert/strict';
import test from 'node:test';

import { runAdminLogoutLifecycle } from './admin-logout-lifecycle';

//===================================================================

test('admin logout is single-flight and always navigates to login', async () => {
  const lock = { current: false };
  const pendingStates: boolean[] = [];
  let resolveLogout: (() => void) | undefined;
  let logoutCalls = 0;
  let navigationCalls = 0;

  const first = runAdminLogoutLifecycle({
    lock,

    logout: async () => {
      logoutCalls += 1;
      await new Promise<void>((resolve) => {
        resolveLogout = resolve;
      });
    },

    setPending: (pending) => pendingStates.push(pending),

    navigateToLogin: () => {
      navigationCalls += 1;
    },
  });

  const second = await runAdminLogoutLifecycle({
    lock,

    logout: async () => {
      logoutCalls += 1;
    },

    setPending: (pending) => pendingStates.push(pending),

    navigateToLogin: () => {
      navigationCalls += 1;
    },
  });

  assert.equal(second, false);
  assert.equal(logoutCalls, 1);

  resolveLogout?.();
  assert.equal(await first, true);

  assert.deepEqual(pendingStates, [true, false]);
  assert.equal(navigationCalls, 1);
  assert.equal(lock.current, false);
});

//===================================================================

test('admin logout redirects even when the remote logout request fails', async () => {
  const lock = { current: false };
  let navigated = false;

  const result = await runAdminLogoutLifecycle({
    lock,

    logout: async () => {
      throw new Error('network');
    },

    setPending: () => undefined,

    navigateToLogin: () => {
      navigated = true;
    },
  });

  assert.equal(result, true);
  assert.equal(navigated, true);
});
