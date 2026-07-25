import assert from 'node:assert/strict';
import test from 'node:test';

import { subscribeOutsidePointerDown } from './outside-pointer-subscription.ts';

//===================================================================

class PointerDownEvent extends Event {
  private readonly path: EventTarget[];

  constructor(path: EventTarget[]) {
    super('pointerdown');
    this.path = path;
  }

  composedPath(): EventTarget[] {
    return this.path;
  }
}

//===================================================================

test('notifies only when the pointer path is outside allowed and ignored targets', () => {
  const documentTarget = new EventTarget();
  const allowed = new EventTarget();
  const ignored = new EventTarget();
  const outside = new EventTarget();
  const events: Event[] = [];

  const unsubscribe = subscribeOutsidePointerDown({
    target: documentTarget,
    getRefs: () => [{ current: allowed }],
    getIgnoredRefs: () => [{ current: ignored }],
    onOutside: (event) => events.push(event),
  });

  documentTarget.dispatchEvent(new PointerDownEvent([allowed]));
  documentTarget.dispatchEvent(new PointerDownEvent([ignored]));
  documentTarget.dispatchEvent(new PointerDownEvent([outside]));

  assert.equal(events.length, 1);
  unsubscribe();
});

//===================================================================

test('uses the latest refs and callback without resubscribing', () => {
  const documentTarget = new EventTarget();
  const firstTarget = new EventTarget();
  const secondTarget = new EventTarget();
  let refs = [{ current: firstTarget }];
  let callbackCalls = 0;
  let callback = (_event: PointerEvent) => {
    callbackCalls += 1;
  };

  const unsubscribe = subscribeOutsidePointerDown({
    target: documentTarget,
    getRefs: () => refs,
    getIgnoredRefs: () => [],
    onOutside: (event) => callback(event),
  });

  refs = [{ current: secondTarget }];
  callback = (_event: PointerEvent) => {
    callbackCalls += 10;
  };

  documentTarget.dispatchEvent(new PointerDownEvent([firstTarget]));
  documentTarget.dispatchEvent(new PointerDownEvent([secondTarget]));

  assert.equal(callbackCalls, 10);
  unsubscribe();
});

//===================================================================

test('unsubscribe and SSR no-op cleanup are idempotent', () => {
  const documentTarget = new EventTarget();
  let calls = 0;

  const unsubscribe = subscribeOutsidePointerDown({
    target: documentTarget,
    getRefs: () => [],
    getIgnoredRefs: () => [],
    onOutside: () => {
      calls += 1;
    },
  });

  unsubscribe();
  unsubscribe();
  documentTarget.dispatchEvent(new PointerDownEvent([]));
  assert.equal(calls, 0);

  const ssrCleanup = subscribeOutsidePointerDown({
    target: null,
    getRefs: () => [],
    getIgnoredRefs: () => [],
    onOutside: () => {
      calls += 1;
    },
  });

  assert.doesNotThrow(ssrCleanup);
});

//===================================================================

test('multiple subscriptions remain isolated during Strict Mode-style cleanup', () => {
  const documentTarget = new EventTarget();
  let firstCalls = 0;
  let secondCalls = 0;

  const cleanupFirst = subscribeOutsidePointerDown({
    target: documentTarget,
    getRefs: () => [],
    getIgnoredRefs: () => [],
    onOutside: () => {
      firstCalls += 1;
    },
  });

  cleanupFirst();

  const cleanupSecond = subscribeOutsidePointerDown({
    target: documentTarget,
    getRefs: () => [],
    getIgnoredRefs: () => [],
    onOutside: () => {
      secondCalls += 1;
    },
  });

  documentTarget.dispatchEvent(new PointerDownEvent([]));
  cleanupSecond();

  assert.equal(firstCalls, 0);
  assert.equal(secondCalls, 1);
});
