import assert from 'node:assert/strict';
import test from 'node:test';

import {
  dispatchPharmacyBreadcrumbLabel,
  subscribeToPharmacyBreadcrumbLabels,
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

test('breadcrumb dispatch captures pathname before the deferred microtask', () => {
  const { fakeWindow, flushMicrotasks } = installWindow(
    '/pharmacy/orders/507f1f77bcf86cd799439011'
  );

  const received: Array<Readonly<{ pathname: string; label: string }>> = [];

  const cleanup = subscribeToPharmacyBreadcrumbLabels((detail) => {
    received.push(detail);
  });

  dispatchPharmacyBreadcrumbLabel('Order #100');
  fakeWindow.location.pathname = '/pharmacy/orders/507f1f77bcf86cd799439012';
  flushMicrotasks();

  assert.deepEqual(received, [
    {
      pathname: '/pharmacy/orders/507f1f77bcf86cd799439011',
      label: 'Order #100',
    },
  ]);

  cleanup();
});

//===================================================================

test('breadcrumb subscription cleanup stops later events', () => {
  const { flushMicrotasks } = installWindow(
    '/pharmacy/clients/507f1f77bcf86cd799439011'
  );

  let calls = 0;

  const cleanup = subscribeToPharmacyBreadcrumbLabels(() => {
    calls += 1;
  });

  cleanup();
  dispatchPharmacyBreadcrumbLabel('Client');
  flushMicrotasks();

  assert.equal(calls, 0);
});
