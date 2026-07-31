import assert from 'node:assert/strict';
import test from 'node:test';

import type { Cart } from '@e-pharmacy/types/cart';

import { isPartialCartMutationError } from './cart-errors';
import { removeCartItemsSequentially } from './cart-pharmacy-removal';

//===================================================================

function cart(totalItems: number): Cart {
  return { items: [], totalItems, totalPrice: totalItems * 10 };
}

//===================================================================

test('refreshes the authoritative cart after a partial pharmacy removal', async () => {
  const confirmed: Cart[] = [];
  const controller = new AbortController();
  let call = 0;

  await assert.rejects(
    removeCartItemsSequentially({
      itemIds: ['a', 'b', 'c'],
      initialCart: cart(3),
      signal: controller.signal,

      removeItem: async () => {
        call += 1;
        if (call === 2) throw new Error('delete failed');
        return { cart: cart(2) };
      },

      refreshCart: async () => ({ cart: cart(2) }),
      onConfirmedCart: (nextCart) => confirmed.push(nextCart),
    }),

    (error: unknown) => {
      assert.equal(isPartialCartMutationError(error), true);
      if (!isPartialCartMutationError(error)) return false;
      assert.equal(error.removedItems, 1);
      assert.equal(error.totalItems, 3);
      assert.equal(error.message, 'PARTIAL_CART_MUTATION');
      return true;
    }
  );

  assert.deepEqual(
    confirmed.map((value) => value.totalItems),
    [2, 2]
  );
});

//===================================================================

test('returns null when the session aborts during removal', async () => {
  const controller = new AbortController();

  const result = await removeCartItemsSequentially({
    itemIds: ['a'],
    initialCart: cart(1),
    signal: controller.signal,

    removeItem: async () => {
      controller.abort();
      throw new DOMException('Session changed', 'AbortError');
    },

    refreshCart: async () => ({ cart: cart(1) }),
    onConfirmedCart: () => undefined,
  });

  assert.equal(result, null);
});

//===================================================================

test('reports authoritative refresh failure after partial removal', async () => {
  const controller = new AbortController();
  let call = 0;

  await assert.rejects(
    removeCartItemsSequentially({
      itemIds: ['a', 'b'],
      initialCart: cart(2),
      signal: controller.signal,

      removeItem: async () => {
        call += 1;
        if (call === 2) throw new Error('delete failed');
        return { cart: cart(1) };
      },

      refreshCart: async () => {
        throw new Error('refresh failed');
      },

      onConfirmedCart: () => undefined,
    }),

    (error: unknown) => {
      assert.equal(isPartialCartMutationError(error), true);
      if (!isPartialCartMutationError(error)) return false;
      assert.equal(error.refreshFailed, true);
      assert.equal(error.requiresReload, true);
      assert.equal(error.latestConfirmedCart.totalItems, 1);
      return true;
    }
  );
});
