import 'client-only';

import { localApiRequest } from '@e-pharmacy/next-api/browser';
import { getResponseData } from '@e-pharmacy/api-client/core';

import type { ApiSuccessResponse } from '@e-pharmacy/types/api';

import type {
  CheckoutOrderPayload,
  CheckoutOrderResponse,
  ClientOrderDetailsResponse,
  ClientOrdersResponse,
} from '@e-pharmacy/types/orders';

import { clientApiRoutes as CLIENT_API_ROUTES } from '@/lib/api/routes';

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

export async function getOrders(): Promise<ClientOrdersResponse> {
  const response = await localApiRequest<
    ApiSuccessResponse<ClientOrdersResponse>
  >(CLIENT_API_ROUTES.orders.list);

  return getResponseData(response);
}

//===================================================================

export async function getOrderDetails(
  orderId: string
): Promise<ClientOrderDetailsResponse> {
  const response = await localApiRequest<
    ApiSuccessResponse<ClientOrderDetailsResponse>
  >(CLIENT_API_ROUTES.orders.details(orderId));

  return getResponseData(response);
}
