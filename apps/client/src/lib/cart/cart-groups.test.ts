import assert from 'node:assert/strict';
import test from 'node:test';

import type { CartItem } from '@e-pharmacy/types/cart';
import type { ISODateTimeString } from '@e-pharmacy/types/primitives';

import { getCartOrderTotal, groupCartItemsByPharmacy } from './cart-groups';

//===================================================================

const PHARMACY_ID = '507f1f77bcf86cd799439011';

function createItem(overrides: Partial<CartItem> = {}): CartItem {
  return {
    id: '507f1f77bcf86cd799439012',
    productOfferId: '507f1f77bcf86cd799439013',
    productId: '507f1f77bcf86cd799439014',
    pharmacyId: PHARMACY_ID,

    product: {
      id: '507f1f77bcf86cd799439014',
      name: 'Product',
      article: 'ARTICLE',
      category: 'medicine',
      price: 10,
      pharmacyName: 'Alpha Pharmacy',
      inStock: true,
    },

    pharmacyName: 'Alpha Pharmacy',
    pharmacyRating: 4.5,
    pharmacyReviewsCount: 12,
    stockQuantity: 10,
    quantity: 1,
    unitPrice: 10,
    totalPrice: 10.105,
    expiresAt: '2027-01-01T00:00:00.000Z' as ISODateTimeString,
    ...overrides,
  };
}

//===================================================================

test('groups cart totals once and exposes immutable output', () => {
  const groups = groupCartItemsByPharmacy([
    createItem(),

    createItem({
      id: '507f1f77bcf86cd799439015',
      quantity: 2,
      totalPrice: 20.105,
    }),
  ]);

  assert.equal(groups.length, 1);
  assert.equal(groups[0].totalItems, 3);
  assert.equal(groups[0].totalPrice, 30.21);
  assert.equal(getCartOrderTotal(groups[0]), 30.21);
  assert.equal(Object.isFrozen(groups), true);
  assert.equal(Object.isFrozen(groups[0]), true);
  assert.equal(Object.isFrozen(groups[0].items), true);
});

//===================================================================

test('does not silently trust inconsistent pharmacy metadata', () => {
  const groups = groupCartItemsByPharmacy([
    createItem(),
    createItem({
      id: '507f1f77bcf86cd799439015',
      pharmacyName: 'Beta Pharmacy',
      pharmacyRating: 4.8,
      pharmacyReviewsCount: 13,
      product: {
        ...createItem().product,
        pharmacyName: 'Beta Pharmacy',
      },
    }),
  ]);

  assert.equal(groups[0].pharmacyName, 'Alpha Pharmacy');
  assert.equal(groups[0].pharmacyRating, undefined);
  assert.equal(groups[0].pharmacyReviewsCount, undefined);
  assert.equal(groups[0].hasInconsistentPharmacyMetadata, true);
});
