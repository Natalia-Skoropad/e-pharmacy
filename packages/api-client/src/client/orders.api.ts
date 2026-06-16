import { apiRequest, getResponseData, localApiRequest } from '../core';
import { apiRoutes as API_ROUTES, clientApiRoutes as CLIENT_API_ROUTES } from '../routes';

import type {
  ApiSuccessResponse,
  CheckoutOrderPayload,
  CheckoutOrderResponse,
  OrderDetailsResponse,
  OrdersResponse,
  UpdateOrderStatusPayload,
  UpdateOrderStatusResponse,
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

//===================================================================

export async function updateOrderStatus(
  orderId: string,
  payload: UpdateOrderStatusPayload
): Promise<UpdateOrderStatusResponse> {
  const response = await apiRequest<
    ApiSuccessResponse<UpdateOrderStatusResponse>
  >(API_ROUTES.orders.updateStatus(orderId), {
    method: 'PATCH',
    body: payload,
  });

  return getResponseData(response);
}
