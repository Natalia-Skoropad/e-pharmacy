import assert from 'node:assert/strict';
import test from 'node:test';

import {
  formatVisibleOrderCount,
  getCollapsedOrderNotificationLabel,
  getOrderCountAriaLabel,
  hasOrderNotifications,
} from './order-counter-presentation';

//===================================================================

test('counter presentation handles 9, 99, 999 and 1000+ without unbounded pills', () => {
  assert.equal(formatVisibleOrderCount(9), '9');
  assert.equal(formatVisibleOrderCount(99), '99');
  assert.equal(formatVisibleOrderCount(999), '999');
  assert.equal(formatVisibleOrderCount(1000), '999+');
  assert.equal(formatVisibleOrderCount(5401), '999+');
});

//===================================================================

test('notification visibility supports zero, one-sided and two-sided counts', () => {
  assert.equal(hasOrderNotifications({ new: 0, inProgress: 0 }), false);
  assert.equal(hasOrderNotifications({ new: 2, inProgress: 0 }), true);
  assert.equal(hasOrderNotifications({ new: 0, inProgress: 3 }), true);
  assert.equal(hasOrderNotifications({ new: 2, inProgress: 3 }), true);
});

//===================================================================

test('expanded and collapsed notification labels expose exact semantic counts', () => {
  assert.equal(getOrderCountAriaLabel(1, 'new'), '1 new order');
  assert.equal(getOrderCountAriaLabel(12, 'new'), '12 new orders');
  assert.equal(getOrderCountAriaLabel(1, 'in_progress'), '1 order in progress');

  assert.equal(
    getCollapsedOrderNotificationLabel({ new: 1000, inProgress: 7 }),
    'Order notifications: 1000 new orders, 7 orders in progress'
  );
});
