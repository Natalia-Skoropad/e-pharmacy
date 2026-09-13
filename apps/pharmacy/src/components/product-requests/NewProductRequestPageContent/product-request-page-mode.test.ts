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

test('existing draft and non-draft requests resolve to edit and readonly modes', () => {
  assert.equal(
    resolveProductRequestPageMode({
      requestId: 'request-id',
      requestStatus: 'draft',
    }),
    'edit'
  );

  for (const requestStatus of [
    'new',
    'in_progress',
    'approved',
    'rejected',
  ] as const) {
    assert.equal(
      resolveProductRequestPageMode({ requestId: 'request-id', requestStatus }),
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
