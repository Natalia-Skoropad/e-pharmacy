import assert from 'node:assert/strict';
import test from 'node:test';

import { createPharmacyReviewSchema } from './pharmacy.schema';
import { createProductReviewSchema } from './product.schema';

//===============================================================

const validReview = {
  rating: 5,
  comment: 'Excellent service',
};

//===============================================================

test('product and pharmacy reviews share rating and English comment contracts', () => {
  for (const schema of [createProductReviewSchema, createPharmacyReviewSchema]) {
    assert.equal(schema.safeParse(validReview).success, true);
    assert.equal(schema.safeParse({ ...validReview, rating: 0 }).success, false);
    assert.equal(
      schema.safeParse({ ...validReview, comment: 'Чудовий сервіс' }).success,
      false
    );
  }
});
