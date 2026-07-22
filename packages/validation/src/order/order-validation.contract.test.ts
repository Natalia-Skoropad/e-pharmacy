import assert from 'node:assert/strict';
import test from 'node:test';

import {
  isOrderDeliveryFormValid,
  validateOrderDeliveryForm,
} from './order-validation';

import {
  validateOrderStatusChange,
  ORDER_REJECTION_REASON_MIN_LENGTH,
} from './order-status-validation';

//===================================================================

const emptyDelivery = {
  recipientName: '',
  recipientPhone: '',
  deliveryAddress: '',
  comment: '',
};

const postalDelivery = {
  recipientName: 'Natalia',
  recipientPhone: '+380501234567',
  deliveryAddress: 'Kyiv, Main Street 10',
  comment: 'Call before delivery',
};

//===================================================================

test('pickup does not require postal details, while postal delivery does', () => {
  assert.equal(isOrderDeliveryFormValid(emptyDelivery, 'pickup'), true);
  assert.equal(
    isOrderDeliveryFormValid(emptyDelivery, 'postal_delivery'),
    false
  );

  assert.deepEqual(
    validateOrderDeliveryForm(postalDelivery, 'postal_delivery'),
    {}
  );
});

//===================================================================

test('rejected order status requires a bounded rejection reason', () => {
  assert.notEqual(
    validateOrderStatusChange({ status: 'rejected', rejectionReason: '' }),
    ''
  );

  assert.equal(
    validateOrderStatusChange({
      status: 'rejected',
      rejectionReason: 'A'.repeat(ORDER_REJECTION_REASON_MIN_LENGTH),
    }),
    ''
  );

  assert.equal(validateOrderStatusChange({ status: 'successful' }), '');
});
