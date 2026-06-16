import assert from 'node:assert/strict';
import test from 'node:test';

import { MAX_PHARMACY_GROUPS_PER_CART } from '../constants/cart';
import { canTransitionOrderStatus } from './order.service';

//===============================================================

test('cart limits the number of pharmacy groups to prevent excessive orders', () => {
  assert.equal(MAX_PHARMACY_GROUPS_PER_CART, 15);
});

//===============================================================

test('order status state machine allows only forward terminal transitions', () => {
  assert.equal(canTransitionOrderStatus('new', 'in_progress'), true);
  assert.equal(canTransitionOrderStatus('new', 'rejected'), true);
  assert.equal(canTransitionOrderStatus('in_progress', 'successful'), true);
  assert.equal(canTransitionOrderStatus('in_progress', 'rejected'), true);
  assert.equal(canTransitionOrderStatus('successful', 'in_progress'), false);
  assert.equal(canTransitionOrderStatus('rejected', 'successful'), false);
});
