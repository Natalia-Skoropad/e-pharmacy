import assert from 'node:assert/strict';
import test from 'node:test';

import { getCartItemUnavailableReason } from './cart-item-availability';

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
