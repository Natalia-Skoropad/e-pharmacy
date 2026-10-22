import assert from 'node:assert/strict';
import test from 'node:test';

import {
  hasMongoDuplicateKeyCode,
  isMongoDuplicateKeyError,
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

//===============================================================

test('structural duplicate key code recognizes driver errors and plain replay objects', () => {
  const ordinary = Object.assign(new Error('duplicate'), { code: 11000 });

  assert.equal(hasMongoDuplicateKeyCode(ordinary), true);
  assert.equal(hasMongoDuplicateKeyCode({ code: 11000 }), true);

  for (const value of [
    null,
    undefined,

    11000,
    '11000',

    { code: '11000' },
    { code: 11001 },
    new Error('other'),
  ]) {
    assert.equal(hasMongoDuplicateKeyCode(value), false);
  }
});

//===============================================================

test('strict duplicate-key guard still requires Error for reading Mongo metadata', () => {
  assert.equal(
    isMongoDuplicateKeyError(
      Object.assign(new Error('duplicate'), { code: 11000 })
    ),
    true
  );

  assert.equal(isMongoDuplicateKeyError({ code: 11000 }), false);
});
