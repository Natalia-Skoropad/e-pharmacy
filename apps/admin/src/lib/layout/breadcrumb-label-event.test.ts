import assert from 'node:assert/strict';
import test from 'node:test';

import {
  dispatchAdminBreadcrumbLabel,
  subscribeToAdminBreadcrumbLabels,
} from './breadcrumb-label-event';

//===================================================================

type QueuedCallback = () => void;

//===================================================================

function installWindow(pathname: string) {
  const target = new EventTarget();
  const queued: QueuedCallback[] = [];

  const fakeWindow = Object.assign(target, {
    location: { pathname },
    queueMicrotask(callback: QueuedCallback) {
      queued.push(callback);
    },
  });

  Object.assign(globalThis, { window: fakeWindow });

  return {
    fakeWindow,
    flushMicrotasks() {
      for (const callback of queued.splice(0)) callback();
    },
  };
}

//===================================================================

test('admin breadcrumb dispatch captures pathname before the deferred microtask', () => {
  const { fakeWindow, flushMicrotasks } = installWindow(
    '/admin/pharmacy-owners/507f1f77bcf86cd799439011'
  );

  const received: Array<Readonly<{ pathname: string; label: string }>> = [];

  const cleanup = subscribeToAdminBreadcrumbLabels((detail) => {
    received.push(detail);
  });

  dispatchAdminBreadcrumbLabel('Nata Six');

  fakeWindow.location.pathname =
    '/admin/pharmacy-owners/507f1f77bcf86cd799439012';

  flushMicrotasks();

  assert.deepEqual(received, [
    {
      pathname: '/admin/pharmacy-owners/507f1f77bcf86cd799439011',
      label: 'Nata Six',
    },
  ]);

  cleanup();
});

//===================================================================

test('admin breadcrumb subscription cleanup stops later events', () => {
  const { flushMicrotasks } = installWindow(
    '/admin/pharmacy-owners/507f1f77bcf86cd799439011'
  );

  let calls = 0;

  const cleanup = subscribeToAdminBreadcrumbLabels(() => {
    calls += 1;
  });

  cleanup();
  dispatchAdminBreadcrumbLabel('Owner');
  flushMicrotasks();

  assert.equal(calls, 0);
});
