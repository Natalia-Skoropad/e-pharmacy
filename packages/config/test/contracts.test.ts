import assert from 'node:assert/strict';
import test from 'node:test';

import * as authConfig from '../src/auth/index.ts';

import {
  CART_PHARMACY_LIMIT_ERROR_CODE,
  MAX_PHARMACY_GROUPS_PER_CART,
} from '../src/cart/index.ts';

import { ALL_PRODUCT_CATEGORIES_FILTER_OPTION } from '../src/products/index.ts';

import {
  DELIVERY_METHOD_LABELS,
  PAYMENT_METHOD_LABELS,
} from '../src/presentation/index.ts';

//===================================================================

test('keeps auth cookie names unique and browser lifetime-free', () => {
  const cookieNames = [
    authConfig.ACCESS_TOKEN_COOKIE_NAME,
    authConfig.REFRESH_TOKEN_COOKIE_NAME,
    authConfig.LEGACY_AUTH_COOKIE_NAME,
    authConfig.AUTH_READY_COOKIE_NAME,
  ];

  assert.equal(new Set(cookieNames).size, cookieNames.length);
  assert.equal('AUTH_READY_COOKIE_MAX_AGE_SECONDS' in authConfig, false);
});

//===================================================================

test('keeps the category fallback limited to the non-domain all option', () => {
  assert.deepEqual(ALL_PRODUCT_CATEGORIES_FILTER_OPTION, {
    value: 'all',
    label: 'All categories',
  });
});

//===================================================================

test('uses canonical delivery and payment copy', () => {
  assert.equal(DELIVERY_METHOD_LABELS.pickup, 'Pickup from pharmacy');
  assert.equal(DELIVERY_METHOD_LABELS.postal_delivery, 'Postal delivery');
  assert.equal(PAYMENT_METHOD_LABELS.cash, 'Cash on pickup / delivery');
  assert.equal(PAYMENT_METHOD_LABELS.bank_transfer, 'Bank transfer');
});

//===================================================================

test('keeps the cart pharmacy-group limit contract explicit', () => {
  assert.equal(Number.isInteger(MAX_PHARMACY_GROUPS_PER_CART), true);
  assert.equal(MAX_PHARMACY_GROUPS_PER_CART > 0, true);
  assert.equal(CART_PHARMACY_LIMIT_ERROR_CODE, 'CART_PHARMACY_LIMIT_EXCEEDED');
});
