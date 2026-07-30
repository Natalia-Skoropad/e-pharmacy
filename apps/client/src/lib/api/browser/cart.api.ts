import 'client-only';

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

import { clientApiRoutes as ROUTES } from '@/lib/api/routes/client-api-routes';

import type {
  MutationRequestOptions,
  ReadRequestOptions,
} from '@/lib/api/request-options';

//===================================================================

async function requestCart(
  path: string,
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  options: ReadRequestOptions | MutationRequestOptions = {},
  body?: AddCartItemPayload | UpdateCartItemPayload
): Promise<CartResponse> {
  return parseApiResponseData(
    await localApiRequest(path, {
      ...options,
      method,
      ...(body === undefined ? {} : { body }),
    }),

    parseCartResponse,
    { url: path, method }
  );
}

//===================================================================

export function getCart(options?: ReadRequestOptions): Promise<CartResponse> {
  return requestCart(ROUTES.cart.current, 'GET', options);
}

//===================================================================

export function addCartItem(
  payload: AddCartItemPayload,
  options: MutationRequestOptions = {}
): Promise<CartResponse> {
  return requestCart(ROUTES.cart.addItem, 'POST', options, payload);
}

//===================================================================

export function updateCartItem(
  cartItemId: string,
  payload: UpdateCartItemPayload,
  options: MutationRequestOptions = {}
): Promise<CartResponse> {
  return requestCart(ROUTES.cart.item(cartItemId), 'PATCH', options, payload);
}

//===================================================================

export function removeCartItem(
  cartItemId: string,
  options: MutationRequestOptions = {}
): Promise<CartResponse> {
  return requestCart(ROUTES.cart.item(cartItemId), 'DELETE', options);
}

//===================================================================

export function clearCart(
  options: MutationRequestOptions = {}
): Promise<CartResponse> {
  return requestCart(ROUTES.cart.clear, 'DELETE', options);
}
