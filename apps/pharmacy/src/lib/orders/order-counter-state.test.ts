import assert from 'node:assert/strict';
import test from 'node:test';

import {
  INITIAL_ORDER_COUNTER_STATE,
  createReadyOrderCounterState,
  createUnavailableOrderCounterState,
  getVisibleOrderCounts,
} from './order-counter-state';

//===================================================================

test('not loaded and failed counters are never presented as authoritative zeroes', () => {
  assert.equal(getVisibleOrderCounts(INITIAL_ORDER_COUNTER_STATE), null);

  assert.equal(
    getVisibleOrderCounts(createUnavailableOrderCounterState()),
    null
  );
});

//===================================================================

test('a failed refresh hides previously successful counters', () => {
  const ready = createReadyOrderCounterState({ new: 5, inProgress: 2 });
  assert.deepEqual(getVisibleOrderCounts(ready), { new: 5, inProgress: 2 });

  const failed = createUnavailableOrderCounterState();
  assert.equal(getVisibleOrderCounts(failed), null);
});

//===================================================================

test('ready state preserves zero, one-sided and two-sided counter values', () => {
  assert.deepEqual(
    getVisibleOrderCounts(
      createReadyOrderCounterState({ new: 0, inProgress: 0 })
    ),
    { new: 0, inProgress: 0 }
  );

  assert.deepEqual(
    getVisibleOrderCounts(
      createReadyOrderCounterState({ new: 3, inProgress: 0 })
    ),
    { new: 3, inProgress: 0 }
  );

  assert.deepEqual(
    getVisibleOrderCounts(
      createReadyOrderCounterState({ new: 3, inProgress: 7 })
    ),
    { new: 3, inProgress: 7 }
  );
});
