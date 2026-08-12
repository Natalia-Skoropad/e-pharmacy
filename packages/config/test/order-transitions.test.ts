import assert from 'node:assert/strict';
import test from 'node:test';

import { getOrderStatusTransitions } from '../src/orders';

//===================================================================

test('order status transitions expose the canonical pharmacy state machine', () => {
  assert.deepEqual(getOrderStatusTransitions('new'), [
    'in_progress',
    'rejected',
  ]);

  assert.deepEqual(getOrderStatusTransitions('in_progress'), [
    'successful',
    'rejected',
  ]);

  assert.deepEqual(getOrderStatusTransitions('successful'), []);
  assert.deepEqual(getOrderStatusTransitions('rejected'), []);
});
