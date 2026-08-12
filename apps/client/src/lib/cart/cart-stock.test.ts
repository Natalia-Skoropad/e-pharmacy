import assert from 'node:assert/strict';
import test from 'node:test';

import type { CartItem } from '@e-pharmacy/types/cart';

import { hasCartItemStockConflict } from './cart-stock';

//===================================================================

function item(quantity: number, stockQuantity: number): CartItem {
  return {
    id: '6a5f5242d9c46211621ad701',
    productOfferId: '6a5f5242d9c46211621ad702',
    productId: '6a5f5242d9c46211621ad703',
    pharmacyId: '6a5f5242d9c46211621ad704',

    product: {
      id: '6a5f5242d9c46211621ad703',
      name: 'Test',
      article: 'TEST-1',
      category: 'medicine',
      price: 10,
      inStock: stockQuantity > 0,
    },

    pharmacyName: 'Test pharmacy',
    stockQuantity,
    quantity,
    unitPrice: 10,
    totalPrice: quantity * 10,
    expiresAt: '2026-08-12T12:00:00.000Z' as CartItem['expiresAt'],
  };
}

//===================================================================

test('reports stock conflicts without masking the server quantity', () => {
  assert.equal(hasCartItemStockConflict(item(5, 0)), true);
  assert.equal(hasCartItemStockConflict(item(5, 2)), true);
  assert.equal(hasCartItemStockConflict(item(5, 5)), false);
  assert.equal(hasCartItemStockConflict(item(5, 6)), false);
});
