import {
  addCartItem as addCartItemRequest,
  clearCart as clearCartRequest,
  removeCartItem as removeCartItemRequest,
  updateCartItem as updateCartItemRequest,
} from '@/lib/api/browser';

import type {
  AddCartItemPayload,
  CartResponse,
  UpdateCartItemPayload,
} from '@e-pharmacy/types';

//===================================================================

export async function addCartItem(
  payload: AddCartItemPayload
): Promise<CartResponse> {
  return addCartItemRequest(payload);
}

//===================================================================

export async function updateCartItem(
  cartItemId: string,
  payload: UpdateCartItemPayload
): Promise<CartResponse> {
  return updateCartItemRequest(cartItemId, payload);
}

//===================================================================

export async function removeCartItem(
  cartItemId: string
): Promise<CartResponse> {
  return removeCartItemRequest(cartItemId);
}

//===================================================================

export async function clearCart(): Promise<CartResponse> {
  return clearCartRequest();
}
