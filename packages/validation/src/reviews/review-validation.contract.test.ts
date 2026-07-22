import assert from 'node:assert/strict';
import test from 'node:test';

import { isReviewFormValid, validateReviewForm } from './review-validation';

//===================================================================

test('review validation enforces rating, length and English-only text', () => {
  assert.equal(
    isReviewFormValid({ rating: 5, comment: 'Excellent service' }),
    true
  );

  assert.notDeepEqual(
    validateReviewForm({ rating: 0, comment: 'Excellent service' }),
    {}
  );

  assert.notDeepEqual(
    validateReviewForm({ rating: 5, comment: 'Чудовий сервіс' }),
    {}
  );
});
