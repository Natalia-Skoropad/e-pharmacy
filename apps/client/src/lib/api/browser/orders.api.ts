import 'client-only';

import { localApiRequest } from '@e-pharmacy/next-api/browser';
import { getResponseData } from '@e-pharmacy/api-client/core';
import { clientApiRoutes as CLIENT_API_ROUTES } from '@/lib/api/routes';

import type {
  ApiSuccessResponse,
  CheckoutOrderPayload,
  CheckoutOrderResponse,
  OrderDetailsResponse,
  OrdersResponse,
} from '@e-pharmacy/types';

//===================================================================

export async function checkoutOrder(
  payload: CheckoutOrderPayload
): Promise<CheckoutOrderResponse> {
  const response = await localApiRequest<
    ApiSuccessResponse<CheckoutOrderResponse>
  >(CLIENT_API_ROUTES.orders.checkout, {
    method: 'POST',
    body: payload,
  });

  return getResponseData(response);
}

//===================================================================

export async function getOrders(): Promise<OrdersResponse> {
  const response = await localApiRequest<ApiSuccessResponse<OrdersResponse>>(
    CLIENT_API_ROUTES.orders.list
  );

  return getResponseData(response);
}

//===================================================================

export async function getOrderDetails(
  orderId: string
): Promise<OrderDetailsResponse> {
  const response = await localApiRequest<
    ApiSuccessResponse<OrderDetailsResponse>
  >(CLIENT_API_ROUTES.orders.details(orderId));

  return getResponseData(response);
}

