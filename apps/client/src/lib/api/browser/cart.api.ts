import 'client-only';

import { localApiRequest } from '@e-pharmacy/next-api/browser';

import {
  getResponseData,
  type JsonResponseRequestOptions,
} from '@e-pharmacy/api-client/core';

import type { ApiSuccessResponse } from '@e-pharmacy/types/api';

import type {
  AddCartItemPayload,
  CartResponse,
  UpdateCartItemPayload,
} from '@e-pharmacy/types/cart';

import { clientApiRoutes as CLIENT_API_ROUTES } from '@/lib/api/routes';

//===================================================================

export function getCartResponseData(
  response: ApiSuccessResponse<CartResponse>
): CartResponse {
  return getResponseData(response);
}

//===================================================================

export async function getCart(
  options?: JsonResponseRequestOptions
): Promise<CartResponse> {
  const response = await localApiRequest<ApiSuccessResponse<CartResponse>>(
    CLIENT_API_ROUTES.cart.current,
    options
  );

  return getCartResponseData(response);
}

//===================================================================

export async function addCartItem(
  payload: AddCartItemPayload
): Promise<CartResponse> {
  const response = await localApiRequest<ApiSuccessResponse<CartResponse>>(
    CLIENT_API_ROUTES.cart.addItem,
    {
      method: 'POST',
      body: payload,
    }
  );

  return getCartResponseData(response);
}

//===================================================================

export async function updateCartItem(
  cartItemId: string,
  payload: UpdateCartItemPayload
): Promise<CartResponse> {
  const response = await localApiRequest<ApiSuccessResponse<CartResponse>>(
    CLIENT_API_ROUTES.cart.item(cartItemId),
    {
      method: 'PATCH',
      body: payload,
    }
  );

  return getCartResponseData(response);
}

//===================================================================

export async function removeCartItem(
  cartItemId: string
): Promise<CartResponse> {
  const response = await localApiRequest<ApiSuccessResponse<CartResponse>>(
    CLIENT_API_ROUTES.cart.item(cartItemId),
    {
      method: 'DELETE',
    }
  );

  return getCartResponseData(response);
}

//===================================================================

export async function clearCart(): Promise<CartResponse> {
  const response = await localApiRequest<ApiSuccessResponse<CartResponse>>(
    CLIENT_API_ROUTES.cart.clear,
    {
      method: 'DELETE',
    }
  );

  return getCartResponseData(response);
}
