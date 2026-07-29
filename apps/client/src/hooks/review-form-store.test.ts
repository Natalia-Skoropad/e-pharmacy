import assert from 'node:assert/strict';
import test from 'node:test';

import { createReviewFormStore } from './review-form-store';

//===================================================================

test('review drafts are isolated by session and target owner key', () => {
  const productA = createReviewFormStore('session-a:product:a');

  productA.update((current) => ({
    ...current,
    values: { rating: 5, comment: 'Draft for A' },
    touchedFields: { rating: true, comment: true },
  }));

  const productB = createReviewFormStore('session-a:product:b');
  const reloggedProductA = createReviewFormStore('session-b:product:a');

  assert.equal(productA.getSnapshot().values.comment, 'Draft for A');
  assert.equal(productB.getSnapshot().values.comment, '');
  assert.equal(reloggedProductA.getSnapshot().values.comment, '');
});

//===================================================================

test('reset clears values, touched fields and submission state', () => {
  const store = createReviewFormStore('session-a:pharmacy:a');

  store.update((current) => ({
    ...current,
    values: { rating: 4, comment: 'Useful review' },
    touchedFields: { rating: true, comment: true },
    isSubmitting: true,
  }));

  store.reset();

  assert.deepEqual(store.getSnapshot().values, { rating: 0, comment: '' });
  assert.deepEqual(store.getSnapshot().touchedFields, {});
  assert.equal(store.getSnapshot().isSubmitting, false);
});
