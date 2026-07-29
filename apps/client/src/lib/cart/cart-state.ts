import type { Cart } from '@e-pharmacy/types/cart';

//===================================================================

export type CartLoadStatus =
  | 'idle'
  | 'loading'
  | 'success'
  | 'refreshing'
  | 'error';

//===================================================================

export type CartState =
  | Readonly<{
      status: 'idle';
      ownerKey: string | null;
    }>
  | Readonly<{
      status: 'loading';
      ownerKey: string;
    }>
  | Readonly<{
      status: 'success';
      ownerKey: string;
      cart: Cart;
    }>
  | Readonly<{
      status: 'refreshing';
      ownerKey: string;
      cart: Cart;
    }>
  | Readonly<{
      status: 'error';
      ownerKey: string;
      cart: Cart | null;
      error: unknown;
    }>;

//===================================================================

export function createInitialCartState(ownerKey: string | null): CartState {
  return { status: 'idle', ownerKey };
}

//===================================================================

export function getCartStateCart(state: CartState): Cart | null {
  if (
    state.status === 'success' ||
    state.status === 'refreshing' ||
    state.status === 'error'
  ) {
    return state.cart;
  }

  return null;
}

//===================================================================

export function beginCartLoad(state: CartState, ownerKey: string): CartState {
  const currentCart = getCartStateCart(state);

  return currentCart
    ? { status: 'refreshing', ownerKey, cart: currentCart }
    : { status: 'loading', ownerKey };
}

//===================================================================

export function completeCartLoad(ownerKey: string, cart: Cart): CartState {
  return { status: 'success', ownerKey, cart };
}

//===================================================================

export function failCartLoad(
  state: CartState,
  ownerKey: string,
  error: unknown
): CartState {
  return {
    status: 'error',
    ownerKey,
    cart: getCartStateCart(state),
    error,
  };
}
