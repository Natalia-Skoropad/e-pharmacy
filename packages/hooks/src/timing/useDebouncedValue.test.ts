import assert from 'node:assert/strict';
import test from 'node:test';

import {
  assertValidDebounceDelay,
  scheduleDebouncedValue,
  type DebounceTimerApi,
} from './debounce-scheduler.ts';

//===================================================================

function createFakeTimers() {
  let nextId = 1;
  const callbacks = new Map<number, () => void>();

  const timers: DebounceTimerApi = {
    setTimeout(callback) {
      const id = nextId;
      nextId += 1;
      callbacks.set(id, callback);
      return id;
    },
    clearTimeout(id) {
      callbacks.delete(id);
    },
  };

  return {
    timers,
    runAll() {
      const scheduled = [...callbacks.values()];
      callbacks.clear();
      for (const callback of scheduled) callback();
    },
    get size() {
      return callbacks.size;
    },
  };
}

//===================================================================

test('commits the latest scheduled value after the delay', () => {
  const fake = createFakeTimers();
  const committed: string[] = [];

  scheduleDebouncedValue({
    value: 'search',
    delayMs: 450,
    commit: (value) => committed.push(value),
    timers: fake.timers,
  });

  assert.deepEqual(committed, []);
  fake.runAll();
  assert.deepEqual(committed, ['search']);
});

//===================================================================

test('cleanup cancels stale values and supports delay changes', () => {
  const fake = createFakeTimers();
  const committed: string[] = [];

  const cleanupFirst = scheduleDebouncedValue({
    value: 'first',
    delayMs: 450,
    commit: (value) => committed.push(value),
    timers: fake.timers,
  });

  cleanupFirst();

  scheduleDebouncedValue({
    value: 'second',
    delayMs: 100,
    commit: (value) => committed.push(value),
    timers: fake.timers,
  });

  assert.equal(fake.size, 1);
  fake.runAll();
  assert.deepEqual(committed, ['second']);
});

//===================================================================

test('Strict Mode-style setup, cleanup, and setup does not duplicate commits', () => {
  const fake = createFakeTimers();
  let commits = 0;

  const firstCleanup = scheduleDebouncedValue({
    value: 1,
    delayMs: 0,
    commit: () => {
      commits += 1;
    },
    timers: fake.timers,
  });

  firstCleanup();

  scheduleDebouncedValue({
    value: 1,
    delayMs: 0,
    commit: () => {
      commits += 1;
    },
    timers: fake.timers,
  });

  fake.runAll();
  assert.equal(commits, 1);
});

//===================================================================

test('rejects invalid delays before scheduling a timer', () => {
  for (const value of [-1, Number.NaN, Number.POSITIVE_INFINITY]) {
    assert.throws(() => assertValidDebounceDelay(value), RangeError);
  }

  assert.doesNotThrow(() => assertValidDebounceDelay(0));
  assert.doesNotThrow(() => assertValidDebounceDelay(450));
});
