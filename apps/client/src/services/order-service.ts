import { apiRequest, getResponseData } from '@/lib/api';
import { API_ROUTES } from '@/lib/constants/api-routes';

import type {
  ApiSuccessResponse,
  CheckoutOrderPayload,
  CheckoutOrderResponse,
  OrderDetailsResponse,
  OrdersResponse,
} from '@/types';

//===================================================================

export async function checkoutOrder(
  payload: CheckoutOrderPayload
): Promise<CheckoutOrderResponse> {
  const response = await apiRequest<ApiSuccessResponse<CheckoutOrderResponse>>(
    API_ROUTES.orders.checkout,
    {
      method: 'POST',
      body: payload,
    }
  );

  return getResponseData(response);
}

//===================================================================

export async function getOrders(): Promise<OrdersResponse> {
  const response = await apiRequest<ApiSuccessResponse<OrdersResponse>>(
    API_ROUTES.orders.list
  );

  return getResponseData(response);
}

//===================================================================

export async function getOrderDetails(
  orderId: string
): Promise<OrderDetailsResponse> {
  const response = await apiRequest<ApiSuccessResponse<OrderDetailsResponse>>(
    API_ROUTES.orders.details(orderId),
  );

  return getResponseData(response);
}
