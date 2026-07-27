import assert from 'node:assert/strict';
import test from 'node:test';

import * as presentation from '../src/presentation/index.ts';

//===================================================================

const {
  ORDER_STATUS_PRESENTATION,
  PRODUCT_REQUEST_STATUS_PRESENTATION,
  PHARMACY_STATUS_PRESENTATION,
  PRODUCT_STATUS_PRESENTATION,
  USER_STATUS_PRESENTATION,
} = presentation;

//===================================================================

test('keeps colliding in_progress statuses domain-specific', () => {
  assert.deepEqual(ORDER_STATUS_PRESENTATION.in_progress, {
    label: 'In progress',
    tone: 'pending',
  });

  assert.deepEqual(PRODUCT_REQUEST_STATUS_PRESENTATION.in_progress, {
    label: 'In work',
    tone: 'pending',
  });
});

//===================================================================

test('keeps shared raw values owned by their domain maps', () => {
  assert.equal(PHARMACY_STATUS_PRESENTATION.active.label, 'Active');
  assert.equal(PRODUCT_STATUS_PRESENTATION.active.label, 'Active');
  assert.equal(USER_STATUS_PRESENTATION.active.label, 'Active');

  assert.equal(PHARMACY_STATUS_PRESENTATION.blocked.tone, 'danger');
  assert.equal(PRODUCT_STATUS_PRESENTATION.blocked.tone, 'danger');
  assert.equal(USER_STATUS_PRESENTATION.blocked.tone, 'danger');
});

//===================================================================

test('does not expose a global string-only resolver', () => {
  assert.equal('getStatusPresentation' in presentation, false);
});
