import 'client-only';

import { buildQueryString, getResponseData } from '@e-pharmacy/api-client/core';
import type { ApiSuccessResponse } from '@e-pharmacy/types';

import { pharmacyApiRoutes as PHARMACY_API_ROUTES } from '@/lib/api/routes/pharmacy-api-routes';

import {
  normalizePharmacyOrderDetails,
  normalizePharmacyOrdersResponse,
  type PharmacyOrderDetails,
  type PharmacyOrdersQueryParams,
  type PharmacyOrdersResponse,
} from '@/lib/orders/orders';

import {
  normalizeOrderSalesStatistics,
  type PharmacyOrderSalesStatisticsQueryParams,
} from '@/lib/orders/order-sales-statistics';

import { localApiRequest } from '@e-pharmacy/next-api/browser';

import type { DeliveryMethod, OrderStatus, PaymentMethod } from '@e-pharmacy/types';

//===================================================================

export async function getPharmacyOrders(
  params: PharmacyOrdersQueryParams = {}
): Promise<PharmacyOrdersResponse> {
  const response = await localApiRequest<ApiSuccessResponse<unknown>>(
    `${PHARMACY_API_ROUTES.orders.list}${buildQueryString(params)}`
  );

  return normalizePharmacyOrdersResponse(getResponseData(response));
}

//===================================================================

export async function getPharmacyOrderDetails(
  orderId: string
): Promise<PharmacyOrderDetails> {
  const response = await localApiRequest<ApiSuccessResponse<unknown>>(
    PHARMACY_API_ROUTES.orders.details(orderId)
  );

  const responsePayload = getResponseData(response) as { order?: unknown };
  const order = normalizePharmacyOrderDetails(responsePayload.order);

  if (!order) {
    throw new Error('Order could not be loaded.');
  }

  return order;
}

//===================================================================

export async function updatePharmacyOrder(
  orderId: string,
  payload: {
    items?: Array<{ productOfferId: string; quantity: number }>;
    deliveryMethod?: DeliveryMethod;
    deliveryDetails?: { recipientName: string; recipientPhone: string; address: string };
    paymentMethod?: PaymentMethod;
    managerComment?: string;
  }
): Promise<PharmacyOrderDetails> {
  const response = await localApiRequest<ApiSuccessResponse<unknown>>(
    PHARMACY_API_ROUTES.orders.details(orderId),
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }
  );

  const responsePayload = getResponseData(response) as { order?: unknown };
  const order = normalizePharmacyOrderDetails(responsePayload.order);

  if (!order) {
    throw new Error('Order could not be updated.');
  }

  return order;
}

//===================================================================

export async function updatePharmacyOrderStatus(
  orderId: string,
  payload: {
    status: Extract<OrderStatus, 'in_progress' | 'successful' | 'rejected'>;
    rejectionReason?: string;
  }
): Promise<PharmacyOrderDetails> {
  const response = await localApiRequest<ApiSuccessResponse<unknown>>(
    PHARMACY_API_ROUTES.orders.status(orderId),
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }
  );

  const responsePayload = getResponseData(response) as { order?: unknown };
  const order = normalizePharmacyOrderDetails(responsePayload.order);

  if (!order) {
    throw new Error('Order could not be updated.');
  }

  return order;
}

//===================================================================

export async function getPharmacyOrderSalesStatistics(
  params: PharmacyOrderSalesStatisticsQueryParams = {}
) {
  const response = await localApiRequest<ApiSuccessResponse<unknown>>(
    `${PHARMACY_API_ROUTES.orders.salesStatistics}${buildQueryString(params)}`
  );

  return normalizeOrderSalesStatistics(getResponseData(response));
}
