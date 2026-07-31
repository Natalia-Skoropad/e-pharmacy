import assert from 'node:assert/strict';
import test from 'node:test';

import { runFavoriteToggleLifecycle } from './favorite-toggle-lifecycle';

//===================================================================

test('allows one favorite mutation and exposes local pending state', async () => {
  const states: boolean[] = [];
  const lock = { current: false };
  let toggles = 0;

  const result = await runFavoriteToggleLifecycle({
    lock,
    disabled: false,
    pending: false,
    setLocalPending: (pending) => states.push(pending),
    onToggle: () => {
      toggles += 1;
    },
  });

  assert.equal(result, true);
  assert.equal(toggles, 1);
  assert.deepEqual(states, [true, false]);
});

//===================================================================

test('rapid clicks cannot start a second favorite mutation', async () => {
  let releaseToggle!: () => void;
  let toggles = 0;
  const lock = { current: false };

  const pendingToggle = new Promise<void>((resolve) => {
    releaseToggle = resolve;
  });

  const options = {
    lock,
    disabled: false,
    pending: false,
    setLocalPending: () => undefined,
    onToggle: async () => {
      toggles += 1;
      await pendingToggle;
    },
  };

  const first = runFavoriteToggleLifecycle(options);
  const second = await runFavoriteToggleLifecycle(options);

  assert.equal(second, false);
  assert.equal(toggles, 1);

  releaseToggle();
  assert.equal(await first, true);
});

//===================================================================

test('disabled and externally pending buttons do not mutate', async () => {
  const lock = { current: false };
  let toggles = 0;
  const createOptions = (disabled: boolean, pending: boolean) => ({
    lock,
    disabled,
    pending,
    setLocalPending: () => undefined,
    onToggle: () => {
      toggles += 1;
    },
  });

  assert.equal(
    await runFavoriteToggleLifecycle(createOptions(true, false)),
    false
  );
  assert.equal(
    await runFavoriteToggleLifecycle(createOptions(false, true)),
    false
  );
  assert.equal(toggles, 0);
});
