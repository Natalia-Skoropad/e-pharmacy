import assert from 'node:assert/strict';
import test from 'node:test';

import type { CartItem } from '@e-pharmacy/types/cart';

import { groupCartItemsByPharmacy } from '@/lib/cart/cart-groups';

import { createCheckoutGroupFingerprint } from './checkout-group-fingerprint';

//===================================================================

const expiresAt = '2026-08-15T10:00:00.000Z' as CartItem['expiresAt'];

function item(overrides: Partial<CartItem> = {}): CartItem {
  const base: CartItem = {
    id: '507f1f77bcf86cd799439011',
    productOfferId: '507f1f77bcf86cd799439012',
    productId: '507f1f77bcf86cd799439013',
    pharmacyId: '507f1f77bcf86cd799439014',

    product: {
      id: '507f1f77bcf86cd799439013',
      name: 'Aspirin',
      article: 'ASP-100',
      category: 'medicine',
      price: 100,
      pharmacyName: 'Health Pharmacy',
      inStock: true,
    },

    pharmacyName: 'Health Pharmacy',
    stockQuantity: 10,
    quantity: 1,
    unitPrice: 100,
    totalPrice: 100,
    expiresAt,
  };

  return { ...base, ...overrides };
}

//===================================================================

function fingerprint(items: readonly CartItem[]): string {
  const group = groupCartItemsByPharmacy(items)[0];
  assert.ok(group);
  return createCheckoutGroupFingerprint(group);
}

//===================================================================

test('checkout fingerprint is stable for an unchanged group', () => {
  const first = item();
  const second = item({
    id: '507f1f77bcf86cd799439021',
    productOfferId: '507f1f77bcf86cd799439022',
    productId: '507f1f77bcf86cd799439023',
    product: {
      ...first.product,
      id: '507f1f77bcf86cd799439023',
      price: 50,
    },
    unitPrice: 50,
    totalPrice: 50,
  });

  assert.equal(fingerprint([first, second]), fingerprint([second, first]));
});

//===================================================================

test('checkout fingerprint changes for quantity, item and price changes', () => {
  const original = item();
  const originalFingerprint = fingerprint([original]);

  assert.notEqual(
    fingerprint([{ ...original, quantity: 2, totalPrice: 200 }]),
    originalFingerprint
  );

  assert.notEqual(
    fingerprint([
      original,
      item({
        id: '507f1f77bcf86cd799439021',
        productOfferId: '507f1f77bcf86cd799439022',
        productId: '507f1f77bcf86cd799439023',
        product: {
          ...original.product,
          id: '507f1f77bcf86cd799439023',
        },
      }),
    ]),
    originalFingerprint
  );

  assert.notEqual(
    fingerprint([
      {
        ...original,
        unitPrice: 120,
        totalPrice: 120,
        product: { ...original.product, price: 120 },
      },
    ]),
    originalFingerprint
  );
});
