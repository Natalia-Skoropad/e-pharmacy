import assert from 'node:assert/strict';
import test from 'node:test';

import {
  checkoutOrderSchema,
  updateOrderDetailsSchema,
  updateOrderStatusSchema,
} from './order.schema';

import { ORDER_REJECTION_REASON_MIN_LENGTH } from '../constants/order-validation';

//===============================================================

const deliveryDetails = {
  recipientName: 'Natalia',
  recipientPhone: '+380501234567',
  address: 'Kyiv, Main Street 10',
};

//===============================================================

test('checkout delivery is discriminated by delivery method', () => {
  const base = {
    pharmacyId: '507f1f77bcf86cd799439011',
    expectedCartRevision: 4,
    groupFingerprint: '{\"cart\":\"reviewed\"}',
    paymentMethod: 'cash' as const,
  };

  assert.equal(
    checkoutOrderSchema.safeParse({ ...base, deliveryMethod: 'pickup' })
      .success,
    true
  );

  assert.equal(
    checkoutOrderSchema.safeParse({
      ...base,
      deliveryMethod: 'pickup',
      deliveryDetails,
    }).success,
    false
  );

  assert.equal(
    checkoutOrderSchema.safeParse({
      ...base,
      deliveryMethod: 'postal_delivery',
    }).success,
    false
  );

  assert.equal(
    checkoutOrderSchema.safeParse({
      ...base,
      deliveryMethod: 'postal_delivery',
      deliveryDetails,
    }).success,
    true
  );
});

//===============================================================

test('order update rejects stale or detached delivery details', () => {
  assert.equal(
    updateOrderDetailsSchema.safeParse({
      deliveryMethod: 'pickup',
      deliveryDetails,
    }).success,
    false
  );

  assert.equal(
    updateOrderDetailsSchema.safeParse({ deliveryDetails }).success,
    false
  );

  assert.equal(
    updateOrderDetailsSchema.safeParse({
      deliveryMethod: 'postal_delivery',
      deliveryDetails,
    }).success,
    true
  );
});

//===============================================================

test('rejected order status requires a bounded reason', () => {
  assert.equal(
    updateOrderStatusSchema.safeParse({ status: 'rejected' }).success,
    false
  );

  assert.equal(
    updateOrderStatusSchema.safeParse({
      status: 'rejected',
      rejectionReason: 'A'.repeat(ORDER_REJECTION_REASON_MIN_LENGTH),
    }).success,
    true
  );
});
