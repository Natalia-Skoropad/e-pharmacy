import assert from 'node:assert/strict';
import test from 'node:test';
import { Types } from 'mongoose';

import { createCheckoutGroupFingerprint } from './checkout-group-fingerprint';

//===================================================================

const pharmacyId = '507f1f77bcf86cd799439014';
const first = {
  id: new Types.ObjectId('507f1f77bcf86cd799439011'),
  productOfferId: new Types.ObjectId('507f1f77bcf86cd799439012'),
  quantity: 1,
  unitPrice: 100,
};

//===================================================================

test('backend checkout fingerprint changes with transactional group data', () => {
  const original = createCheckoutGroupFingerprint({
    pharmacyId,
    items: [first],
  });

  assert.notEqual(
    createCheckoutGroupFingerprint({
      pharmacyId,
      items: [{ ...first, quantity: 2 }],
    }),

    original
  );

  assert.notEqual(
    createCheckoutGroupFingerprint({
      pharmacyId,
      items: [{ ...first, unitPrice: 120 }],
    }),

    original
  );
});
