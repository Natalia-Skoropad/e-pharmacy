import assert from 'node:assert/strict';
import test from 'node:test';

import { ORDER_STATUSES } from '../src/orders/index.ts';
import { PHARMACY_STATUSES } from '../src/pharmacies/index.ts';
import { PRODUCT_REQUEST_STATUSES } from '../src/product-requests/index.ts';
import { PRODUCT_STATUSES } from '../src/products/index.ts';
import { USER_STATUSES } from '../src/users/index.ts';
import * as presentation from '../src/presentation/index.ts';

//===================================================================

const {
  ORDER_STATUS_PRESENTATION,
  PRODUCT_REQUEST_STATUS_PRESENTATION,
  PHARMACY_STATUS_PRESENTATION,
  PRODUCT_STATUS_PRESENTATION,
  USER_STATUS_PRESENTATION,
} = presentation;

const ALLOWED_TONES = new Set([
  'info',
  'pending',
  'success',
  'warning',
  'danger',
  'neutral',
]);

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

test('keeps each domain presentation exhaustive at runtime', () => {
  const mappings = [
    [ORDER_STATUSES, ORDER_STATUS_PRESENTATION],
    [PHARMACY_STATUSES, PHARMACY_STATUS_PRESENTATION],
    [PRODUCT_STATUSES, PRODUCT_STATUS_PRESENTATION],
    [PRODUCT_REQUEST_STATUSES, PRODUCT_REQUEST_STATUS_PRESENTATION],
    [USER_STATUSES, USER_STATUS_PRESENTATION],
  ] as const;

  for (const [values, mapping] of mappings) {
    assert.deepEqual(Object.keys(mapping).sort(), [...values].sort());
  }
});

//===================================================================

test('uses only semantic tones and non-empty labels', () => {
  for (const mapping of [
    ORDER_STATUS_PRESENTATION,
    PHARMACY_STATUS_PRESENTATION,
    PRODUCT_STATUS_PRESENTATION,
    PRODUCT_REQUEST_STATUS_PRESENTATION,
    USER_STATUS_PRESENTATION,
  ]) {
    for (const item of Object.values(mapping)) {
      assert.equal(item.label.trim().length > 0, true);
      assert.equal(ALLOWED_TONES.has(item.tone), true);
    }
  }
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
