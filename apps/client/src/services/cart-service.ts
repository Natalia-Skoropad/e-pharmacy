import { apiRequest, getResponseData } from '@/lib/api';
import { API_ROUTES } from '@/lib/constants/api-routes';
import { dispatchCartUpdated } from '@/lib/cart/cart-events';

import type {
  AddCartItemPayload,
  ApiSuccessResponse,
  CartResponse,
  UpdateCartItemPayload,
} from '@/types';

//===================================================================

function getCartResponseData(
  response: ApiSuccessResponse<CartResponse>,
  shouldNotify = false
): CartResponse {
  const data = getResponseData(response);

  if (shouldNotify) {
    dispatchCartUpdated(data.cart);
  }

  return data;
}

//===================================================================

export async function getCart(authToken: string): Promise<CartResponse> {
  const response = await apiRequest<ApiSuccessResponse<CartResponse>>(
    API_ROUTES.cart.current,
    {
      authToken,
    }
  );

  return getCartResponseData(response);
}

//===================================================================

export async function addCartItem(
  payload: AddCartItemPayload,
  authToken: string
): Promise<CartResponse> {
  const response = await apiRequest<ApiSuccessResponse<CartResponse>>(
    API_ROUTES.cart.addItem,
    {
      method: 'POST',
      body: payload,
      authToken,
    }
  );

  return getCartResponseData(response, true);
}

//===================================================================

export async function updateCartItem(
  cartItemId: string,
  payload: UpdateCartItemPayload,
  authToken: string
): Promise<CartResponse> {
  const response = await apiRequest<ApiSuccessResponse<CartResponse>>(
    API_ROUTES.cart.updateItem(cartItemId),
    {
      method: 'PATCH',
      body: payload,
      authToken,
    }
  );

  return getCartResponseData(response, true);
}

//===================================================================

export async function removeCartItem(
  cartItemId: string,
  authToken: string
): Promise<CartResponse> {
  const response = await apiRequest<ApiSuccessResponse<CartResponse>>(
    API_ROUTES.cart.removeItem(cartItemId),
    {
      method: 'DELETE',
      authToken,
    }
  );

  return getCartResponseData(response, true);
}

//===================================================================

export async function clearCart(authToken: string): Promise<CartResponse> {
  const response = await apiRequest<ApiSuccessResponse<CartResponse>>(
    API_ROUTES.cart.clear,
    {
      method: 'DELETE',
      authToken,
    }
  );

  return getCartResponseData(response, true);
}
