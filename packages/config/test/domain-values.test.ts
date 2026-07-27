import assert from 'node:assert/strict';
import test from 'node:test';

import { AUTH_APPLICATIONS, USER_ROLES } from '../src/auth/index.ts';
import { PHARMACY_NOTE_ENTITY_TYPES } from '../src/notes/index.ts';

import {
  DELIVERY_METHODS,
  ORDER_CREATED_BY_TYPES,
  ORDER_STATUSES,
  PAYMENT_METHODS,
} from '../src/orders/index.ts';

import { PHARMACY_STATUSES } from '../src/pharmacies/index.ts';
import { PRODUCT_REQUEST_STATUSES } from '../src/product-requests/index.ts';
import { PRODUCT_CATEGORIES, PRODUCT_STATUSES } from '../src/products/index.ts';
import { USER_STATUSES } from '../src/users/index.ts';

//===================================================================

const VALUE_SETS = {
  AUTH_APPLICATIONS,
  USER_ROLES,
  USER_STATUSES,
  PHARMACY_STATUSES,
  PRODUCT_STATUSES,
  PRODUCT_REQUEST_STATUSES,
  ORDER_STATUSES,
  DELIVERY_METHODS,
  PAYMENT_METHODS,
  ORDER_CREATED_BY_TYPES,
  PHARMACY_NOTE_ENTITY_TYPES,
  PRODUCT_CATEGORIES,
} as const;

//===================================================================

test('keeps canonical runtime value sets free of duplicates and empty values', () => {
  for (const [name, values] of Object.entries(VALUE_SETS)) {
    assert.equal(
      new Set(values).size,
      values.length,
      `${name} contains duplicate values`
    );

    assert.equal(
      values.every((value) => value.trim().length > 0),
      true,
      `${name} contains an empty value`
    );
  }
});

//===================================================================

test('keeps the expected product and order runtime contracts', () => {
  assert.deepEqual(PRODUCT_STATUSES, ['new', 'active', 'blocked']);

  assert.deepEqual(ORDER_STATUSES, [
    'new',
    'in_progress',
    'successful',
    'rejected',
  ]);

  assert.deepEqual(ORDER_CREATED_BY_TYPES, ['client', 'manager']);
});
