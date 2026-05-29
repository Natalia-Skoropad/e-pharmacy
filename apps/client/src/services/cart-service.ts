import { getResponseData, localApiRequest } from '@/lib/api';
import { dispatchCartUpdated } from '@/lib/cart/cart-events';
import { CLIENT_API_ROUTES } from '@/lib/constants/client-api-routes';

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

  return getCartResponseData(response, true);
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

  return getCartResponseData(response, true);
}

//===================================================================

export async function removeCartItem(cartItemId: string): Promise<CartResponse> {
  const response = await localApiRequest<ApiSuccessResponse<CartResponse>>(
    CLIENT_API_ROUTES.cart.removeItem(cartItemId),
    {
      method: 'DELETE',
    }
  );

  return getCartResponseData(response, true);
}

//===================================================================

export async function clearCart(): Promise<CartResponse> {
  const response = await localApiRequest<ApiSuccessResponse<CartResponse>>(
    CLIENT_API_ROUTES.cart.clear,
    {
      method: 'DELETE',
    }
  );

  return getCartResponseData(response, true);
}
