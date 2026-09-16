import assert from 'node:assert/strict';
import test from 'node:test';

import { createManagerOrderRequestFingerprint } from './manager-order-request-fingerprint';

//===================================================================

const BASE_INPUT = {
  clientRequestId: '0b52d3c7-e4ec-4bb9-93e1-bab297a666ab',
  clientId: '507f1f77bcf86cd799439011',

  items: [
    { productOfferId: '507f1f77bcf86cd799439012', quantity: 1 },
    { productOfferId: '507f1f77bcf86cd799439013', quantity: 2 },
  ],

  paymentMethod: 'cash' as const,
  deliveryMethod: 'pickup' as const,
  comment: '',
};

//===================================================================

test('manager order request fingerprint ignores the replay key and normalizes item order', () => {
  const first = createManagerOrderRequestFingerprint(BASE_INPUT);

  const second = createManagerOrderRequestFingerprint({
    ...BASE_INPUT,
    clientRequestId: '372cdf9b-a300-450d-81ed-60f114516eb5',
    items: [...BASE_INPUT.items].reverse(),
  });

  assert.equal(first, second);
});

//===================================================================

test('manager order request fingerprint changes when transactional order data changes', () => {
  const original = createManagerOrderRequestFingerprint(BASE_INPUT);

  const changed = createManagerOrderRequestFingerprint({
    ...BASE_INPUT,
    items: [
      { productOfferId: '507f1f77bcf86cd799439012', quantity: 2 },
      { productOfferId: '507f1f77bcf86cd799439013', quantity: 2 },
    ],
  });

  assert.notEqual(original, changed);
});
