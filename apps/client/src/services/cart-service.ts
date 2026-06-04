import {
  addCartItem as addCartItemRequest,
  clearCart as clearCartRequest,
  getCart,
  removeCartItem as removeCartItemRequest,
  updateCartItem as updateCartItemRequest,
} from '@e-pharmacy/api-client/client';

import { dispatchCartUpdated } from '@/lib/cart/cart-events';

import type {
  AddCartItemPayload,
  CartResponse,
  UpdateCartItemPayload,
} from '@/types';

//===================================================================

function notifyCartUpdated(response: CartResponse): CartResponse {
  dispatchCartUpdated(response.cart);

  return response;
}

//===================================================================

export { getCart };

//===================================================================

export async function addCartItem(
  payload: AddCartItemPayload
): Promise<CartResponse> {
  return notifyCartUpdated(await addCartItemRequest(payload));
}

//===================================================================

export async function updateCartItem(
  cartItemId: string,
  payload: UpdateCartItemPayload
): Promise<CartResponse> {
  return notifyCartUpdated(await updateCartItemRequest(cartItemId, payload));
}

//===================================================================

export async function removeCartItem(cartItemId: string): Promise<CartResponse> {
  return notifyCartUpdated(await removeCartItemRequest(cartItemId));
}

//===================================================================

export async function clearCart(): Promise<CartResponse> {
  return notifyCartUpdated(await clearCartRequest());
}
