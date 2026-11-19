import assert from 'node:assert/strict';
import test from 'node:test';

import {
  exceedsAvailableStockOnIncrease,
  getCartItemUnavailableReason,
} from './cart-item-availability';

//===============================================================

const available = {
  isExpired: false,
  offerExists: true,
  productStatus: 'active',
  pharmacyStatus: 'active',
} as const;

//===============================================================

test('classifies stale cart references without silently dropping them', () => {
  assert.equal(getCartItemUnavailableReason(available), null);

  assert.equal(
    getCartItemUnavailableReason({ ...available, isExpired: true }),
    'expired'
  );

  assert.equal(
    getCartItemUnavailableReason({ ...available, offerExists: false }),
    'offer_unavailable'
  );

  assert.equal(
    getCartItemUnavailableReason({ ...available, productStatus: undefined }),
    'product_unavailable'
  );

  assert.equal(
    getCartItemUnavailableReason({ ...available, productStatus: 'blocked' }),
    'product_unavailable'
  );

  assert.equal(
    getCartItemUnavailableReason({ ...available, pharmacyStatus: undefined }),
    'pharmacy_unavailable'
  );

  assert.equal(
    getCartItemUnavailableReason({ ...available, pharmacyStatus: 'blocked' }),
    'pharmacy_unavailable'
  );
});

//===============================================================

test('allows reducing an over-allocated cart item without weakening stock checks on increases', () => {
  // Another order reserved two units after the client put five in the cart.
  assert.equal(exceedsAvailableStockOnIncrease(5, 4, 3), false);
  assert.equal(exceedsAvailableStockOnIncrease(4, 3, 3), false);
  assert.equal(exceedsAvailableStockOnIncrease(5, 1, 0), false);

  // Even when the remaining quantity is valid, an increase beyond stock
  // must still be rejected by the API.
  assert.equal(exceedsAvailableStockOnIncrease(3, 4, 3), true);
  assert.equal(exceedsAvailableStockOnIncrease(1, 2, 0), true);
  assert.equal(exceedsAvailableStockOnIncrease(2, 3, 3), false);
});
