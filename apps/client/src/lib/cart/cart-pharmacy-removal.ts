import type { Cart, CartResponse } from '@e-pharmacy/types/cart';

import { PartialCartMutationError } from './cart-errors';

//===================================================================

type RemoveCartItem = (
  cartItemId: string,
  signal: AbortSignal
) => Promise<CartResponse>;

//===================================================================

type RefreshCart = (signal: AbortSignal) => Promise<CartResponse>;

//===================================================================

export async function removeCartItemsSequentially({
  itemIds,
  initialCart,
  signal,
  removeItem,
  refreshCart,
  onConfirmedCart,
}: Readonly<{
  itemIds: readonly string[];
  initialCart: Cart;
  signal: AbortSignal;
  removeItem: RemoveCartItem;
  refreshCart: RefreshCart;
  onConfirmedCart: (cart: Cart) => void;
}>): Promise<Cart | null> {
  let removedItems = 0;
  let latestCart = initialCart;

  try {
    for (const itemId of itemIds) {
      const response = await removeItem(itemId, signal);
      if (signal.aborted) return null;

      latestCart = response.cart;
      removedItems += 1;
      onConfirmedCart(latestCart);
    }

    return latestCart;
  } catch (error) {
    if (signal.aborted) return null;

    let refreshCause: unknown;

    try {
      const authoritative = await refreshCart(signal);
      if (!signal.aborted) {
        latestCart = authoritative.cart;
        onConfirmedCart(authoritative.cart);
      }
    } catch (refreshError) {
      refreshCause = refreshError;
    }

    if (removedItems > 0) {
      throw new PartialCartMutationError({
        removedItems,
        totalItems: itemIds.length,
        latestConfirmedCart: latestCart,
        cause: error,
        refreshCause,
      });
    }

    throw error;
  }
}
