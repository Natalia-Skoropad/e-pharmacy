import assert from 'node:assert/strict';
import test from 'node:test';

import {
  isDuplicatePharmacyReviewError,
  isDuplicateProductReviewError,
} from './mongoError';

//===============================================================

function duplicateKeyError(
  keyPattern: Record<string, number>,
  keyValue?: Record<string, string>
): Error & {
  code: number;
  keyPattern: Record<string, number>;
  keyValue?: Record<string, string>;
} {
  return Object.assign(new Error('E11000 duplicate key error'), {
    code: 11000,
    keyPattern,
    ...(keyValue ? { keyValue } : {}),
  });
}

//===============================================================

test('classifies only entity + user duplicate keys as review uniqueness conflicts', () => {
  assert.equal(
    isDuplicateProductReviewError(
      duplicateKeyError({ productId: 1, userId: 1 })
    ),
    true
  );

  assert.equal(
    isDuplicatePharmacyReviewError(
      duplicateKeyError({ pharmacyId: 1, userId: 1 })
    ),
    true
  );

  assert.equal(
    isDuplicateProductReviewError(
      duplicateKeyError({}, { productId: 'product', userId: 'user' })
    ),
    true
  );

  assert.equal(
    isDuplicateProductReviewError(duplicateKeyError({ email: 1 })),
    false
  );

  assert.equal(
    isDuplicatePharmacyReviewError(duplicateKeyError({ phone: 1 })),
    false
  );
});
