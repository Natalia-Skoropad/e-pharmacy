import 'client-only';

import { buildQueryString, getResponseData } from '@e-pharmacy/api-client/core';
import type { ApiSuccessResponse } from '@e-pharmacy/types';
import { localApiRequest } from '@e-pharmacy/next-api/browser';

import type {
  DeliveryMethod,
  OrderStatus,
  PaymentMethod,
} from '@e-pharmacy/types';

import { pharmacyApiRoutes as PHARMACY_API_ROUTES } from '@/lib/api/routes/pharmacy-api-routes';

import {
  normalizePharmacyOrderDetails,
  normalizePharmacyOrderManagerComment,
  normalizePharmacyOrderManagerCommentsResponse,
  normalizePharmacyOrdersResponse,
  type PharmacyOrderDetails,
  type PharmacyOrderManagerComment,
  type PharmacyOrderManagerCommentsResponse,
  type PharmacyOrdersQueryParams,
  type PharmacyOrdersResponse,
} from '@/lib/orders/orders';

import {
  normalizeOrderSalesStatistics,
  type PharmacyOrderSalesStatisticsQueryParams,
} from '@/lib/orders/order-sales-statistics';

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
    deliveryDetails?: {
      recipientName: string;
      recipientPhone: string;
      address: string;
    };
    paymentMethod?: PaymentMethod;
  }
): Promise<PharmacyOrderDetails> {
  const response = await localApiRequest<ApiSuccessResponse<unknown>>(
    PHARMACY_API_ROUTES.orders.details(orderId),
    {
      method: 'PATCH',
      body: payload,
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
      body: payload,
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

export async function getPharmacyOrderComments(
  orderId: string,
  params: { page?: number; perPage?: number } = {}
): Promise<PharmacyOrderManagerCommentsResponse> {
  const response = await localApiRequest<ApiSuccessResponse<unknown>>(
    `${PHARMACY_API_ROUTES.orders.comments(orderId)}${buildQueryString(params)}`
  );

  return normalizePharmacyOrderManagerCommentsResponse(
    getResponseData(response)
  );
}

//===================================================================

export async function createPharmacyOrderComment(
  orderId: string,
  text: string
): Promise<PharmacyOrderManagerComment> {
  const response = await localApiRequest<ApiSuccessResponse<unknown>>(
    PHARMACY_API_ROUTES.orders.comments(orderId),
    { method: 'POST', body: { text } }
  );

  const data = getResponseData(response) as { comment?: unknown };
  const comment = normalizePharmacyOrderManagerComment(data.comment);

  if (!comment) throw new Error('Comment could not be created.');

  return comment;
}

//===================================================================

export async function deletePharmacyOrderComment(
  orderId: string,
  commentId: string
): Promise<void> {
  await localApiRequest<ApiSuccessResponse<unknown>>(
    PHARMACY_API_ROUTES.orders.comment(orderId, commentId),
    { method: 'DELETE' }
  );
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
