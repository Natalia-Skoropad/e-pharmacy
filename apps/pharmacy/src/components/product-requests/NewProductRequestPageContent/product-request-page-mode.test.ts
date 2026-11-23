import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getProductRequestGenerationKey,
  resolveProductRequestPageMode,
} from './product-request-page-mode';

//===================================================================

test('product request page mode is explicit for new and clone flows', () => {
  assert.equal(resolveProductRequestPageMode({}), 'new');

  assert.equal(
    resolveProductRequestPageMode({ sourceRequestId: 'source-request' }),
    'clone'
  );
});

//===================================================================

test('New and Needs changes requests are editable; pending and terminal are read-only', () => {
  assert.equal(
    resolveProductRequestPageMode({ requestId: 'id', requestStatus: 'new' }),
    'edit'
  );

  assert.equal(
    resolveProductRequestPageMode({
      requestId: 'id',
      requestStatus: 'on_moderation',
      reviewState: 'changes_requested',
    }),
    'edit'
  );

  for (const status of ['on_moderation', 'approved', 'rejected'] as const) {
    assert.equal(
      resolveProductRequestPageMode({ requestId: 'id', requestStatus: status }),
      'readonly'
    );
  }
});

//===================================================================

test('product request generation keys isolate existing, clone, and new lifecycles', () => {
  assert.equal(
    getProductRequestGenerationKey({ requestId: 'request-a' }),
    'request:request-a'
  );

  assert.equal(
    getProductRequestGenerationKey({ sourceRequestId: 'request-a' }),
    'clone:request-a'
  );

  assert.equal(getProductRequestGenerationKey({}), 'new-product-request');
});
