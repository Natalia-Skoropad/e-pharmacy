import type { Cart } from '@e-pharmacy/types';

//===================================================================

export const CART_UPDATED_EVENT = 'cart-updated';

export type CartUpdatedEventDetail = {
  totalItems: number;
  cart?: Cart;
};

//===================================================================

export function dispatchCartUpdated(cart: Cart): void {
  if (typeof window === 'undefined') return;

  window.dispatchEvent(
    new CustomEvent<CartUpdatedEventDetail>(CART_UPDATED_EVENT, {
      detail: {
        totalItems: cart.totalItems,
        cart,
      },
    })
  );
}
