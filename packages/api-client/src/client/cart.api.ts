import { getResponseData, localApiRequest } from '../core';
import { clientApiRoutes as CLIENT_API_ROUTES } from '../routes';

import type {
  AddCartItemPayload,
  ApiSuccessResponse,
  CartResponse,
  UpdateCartItemPayload,
} from '@e-pharmacy/types';

//===================================================================

export function getCartResponseData(
  response: ApiSuccessResponse<CartResponse>
): CartResponse {
  return getResponseData(response);
}

//===================================================================

export async function getCart(): Promise<CartResponse> {
  const response = await localApiRequest<ApiSuccessResponse<CartResponse>>(
    CLIENT_API_ROUTES.cart.current
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
    CLIENT_API_ROUTES.cart.updateItem(cartItemId),
    {
      method: 'PATCH',
      body: payload,
    }
  );

  return getCartResponseData(response);
}

//===================================================================

export async function removeCartItem(cartItemId: string): Promise<CartResponse> {
  const response = await localApiRequest<ApiSuccessResponse<CartResponse>>(
    CLIENT_API_ROUTES.cart.removeItem(cartItemId),
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
