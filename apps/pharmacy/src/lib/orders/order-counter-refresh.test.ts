import assert from 'node:assert/strict';
import test from 'node:test';

import {
  dispatchOrderCounterRefresh,
  subscribeToOrderCounterRefresh,
} from './order-counter-refresh';

//===================================================================

function installWindow() {
  const fakeWindow = new EventTarget();
  Object.assign(globalThis, { window: fakeWindow });
}

//===================================================================

test('order counter refresh notifies active subscribers', () => {
  installWindow();
  let calls = 0;

  const cleanup = subscribeToOrderCounterRefresh(() => {
    calls += 1;
  });

  dispatchOrderCounterRefresh();
  assert.equal(calls, 1);

  cleanup();
});

//===================================================================

test('order counter refresh cleanup removes the subscriber', () => {
  installWindow();
  let calls = 0;

  const cleanup = subscribeToOrderCounterRefresh(() => {
    calls += 1;
  });

  cleanup();
  dispatchOrderCounterRefresh();

  assert.equal(calls, 0);
});
