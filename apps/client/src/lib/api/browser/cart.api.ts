import 'client-only';

import type { JsonResponseRequestOptions } from '@e-pharmacy/api-client/transport';

import {
  parseApiResponseData,
  parseCartResponse,
} from '@e-pharmacy/api-client/response';

import { localApiRequest } from '@e-pharmacy/next-api/browser';

import type {
  AddCartItemPayload,
  CartResponse,
  UpdateCartItemPayload,
} from '@e-pharmacy/types/cart';

import { clientApiRoutes as CLIENT_API_ROUTES } from '@/lib/api/routes';

//===================================================================

async function requestCart(
  path: string,
  options?: JsonResponseRequestOptions
): Promise<CartResponse> {
  return parseApiResponseData(
    await localApiRequest(path, options),
    parseCartResponse,
    { url: path, method: options?.method ?? 'GET' }
  );
}

//===================================================================

export function getCart(
  options?: JsonResponseRequestOptions
): Promise<CartResponse> {
  return requestCart(CLIENT_API_ROUTES.cart.current, options);
}

//===================================================================

export function addCartItem(
  payload: AddCartItemPayload
): Promise<CartResponse> {
  return requestCart(CLIENT_API_ROUTES.cart.addItem, {
    method: 'POST',
    body: payload,
  });
}

//===================================================================

export function updateCartItem(
  cartItemId: string,
  payload: UpdateCartItemPayload
): Promise<CartResponse> {
  return requestCart(CLIENT_API_ROUTES.cart.item(cartItemId), {
    method: 'PATCH',
    body: payload,
  });
}

//===================================================================

export function removeCartItem(cartItemId: string): Promise<CartResponse> {
  return requestCart(CLIENT_API_ROUTES.cart.item(cartItemId), {
    method: 'DELETE',
  });
}

//===================================================================

export function clearCart(): Promise<CartResponse> {
  return requestCart(CLIENT_API_ROUTES.cart.clear, { method: 'DELETE' });
}
