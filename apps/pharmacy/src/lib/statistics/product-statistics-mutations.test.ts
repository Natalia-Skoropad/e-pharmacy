import assert from 'node:assert/strict';
import test from 'node:test';

import {
  applyAddedProductStatistics,
  applyRemovedOwnProductStatistics,
} from './product-statistics-mutations';

//===================================================================

test('adding a product updates only pharmacy-membership product statistics', () => {
  const next = applyAddedProductStatistics({
    active: 12,
    blocked: 3,
    addedToPharmacy: 5,
    notAddedToPharmacy: 10,
  });

  assert.deepEqual(next, {
    active: 12,
    blocked: 3,
    addedToPharmacy: 6,
    notAddedToPharmacy: 9,
  });
});

//===================================================================

test('removing an own product subtracts its stock contribution without producing negative statistics', () => {
  const next = applyRemovedOwnProductStatistics(
    {
      inStock: { quantity: 20, amount: 2000 },
      reserved: { quantity: 4, amount: 400 },
      available: { quantity: 16, amount: 1600 },
      outOfStock: { quantity: 2 },
    },
    {
      stockQuantity: 5,
      reservedQuantity: 1,
      availableQuantity: 4,
      currentPrice: 100,
    }
  );

  assert.deepEqual(next, {
    inStock: { quantity: 15, amount: 1500 },
    reserved: { quantity: 3, amount: 300 },
    available: { quantity: 12, amount: 1200 },
    outOfStock: { quantity: 2 },
  });

  const clamped = applyRemovedOwnProductStatistics(
    {
      inStock: { quantity: 1, amount: 10 },
      reserved: { quantity: 0, amount: 0 },
      available: { quantity: 1, amount: 10 },
      outOfStock: { quantity: 1 },
    },
    {
      stockQuantity: 2,
      reservedQuantity: 0,
      availableQuantity: 2,
      currentPrice: 10,
    }
  );

  assert.equal(clamped.inStock.quantity, 0);
  assert.equal(clamped.inStock.amount, 0);
  assert.equal(clamped.available.quantity, 0);
  assert.equal(clamped.available.amount, 0);
});

//===================================================================

test('removing a zero-stock product decrements the out-of-stock product count', () => {
  const next = applyRemovedOwnProductStatistics(
    {
      inStock: { quantity: 0, amount: 0 },
      reserved: { quantity: 0, amount: 0 },
      available: { quantity: 0, amount: 0 },
      outOfStock: { quantity: 3 },
    },
    {
      stockQuantity: 0,
      reservedQuantity: 0,
      availableQuantity: 0,
      currentPrice: 50,
    }
  );

  assert.equal(next.outOfStock.quantity, 2);
});
