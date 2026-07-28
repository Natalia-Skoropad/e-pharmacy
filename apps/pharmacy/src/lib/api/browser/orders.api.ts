import 'client-only';

import {
  appendQueryParams,
  getResponseData,
  type JsonResponseRequestOptions,
} from '@e-pharmacy/api-client/core';

import type { ApiSuccessResponse } from '@e-pharmacy/types/api';
import { localApiRequest } from '@e-pharmacy/next-api/browser';

import type {
  CreateOrderManagerCommentPayload,
  CreateOrderManagerCommentResponse,
  DeliveryMethod,
  OrderManagerCommentsResponse,
  PaymentMethod,
  UpdateOrderStatusPayload,
} from '@e-pharmacy/types/orders';

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

export type CreatePharmacyOrderPayload = Readonly<{
  clientId: string;
  items: Array<{ productOfferId: string; quantity: number }>;
  deliveryMethod: DeliveryMethod;
  deliveryDetails?: {
    recipientName: string;
    recipientPhone: string;
    address: string;
  };
  paymentMethod: PaymentMethod;
  comment?: string;
}>;

//===================================================================

export async function createPharmacyOrder(
  payload: CreatePharmacyOrderPayload
): Promise<PharmacyOrderDetails> {
  const response = await localApiRequest<ApiSuccessResponse<unknown>>(
    PHARMACY_API_ROUTES.orders.list,
    {
      method: 'POST',
      body: payload,
    }
  );

  const responsePayload = getResponseData(response) as { order?: unknown };
  const order = normalizePharmacyOrderDetails(responsePayload.order);

  if (!order) {
    throw new Error('Order could not be created.');
  }

  return order;
}

//===================================================================

export async function getPharmacyOrders(
  params: PharmacyOrdersQueryParams = {},
  options?: JsonResponseRequestOptions
): Promise<PharmacyOrdersResponse> {
  const response = await localApiRequest<ApiSuccessResponse<unknown>>(
    appendQueryParams(PHARMACY_API_ROUTES.orders.list, params),
    options
  );

  return normalizePharmacyOrdersResponse(getResponseData(response));
}

//===================================================================

export async function getPharmacyOrderDetails(
  orderId: string,
  options?: JsonResponseRequestOptions
): Promise<PharmacyOrderDetails> {
  const response = await localApiRequest<ApiSuccessResponse<unknown>>(
    PHARMACY_API_ROUTES.orders.details(orderId),
    options
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
  payload: UpdateOrderStatusPayload
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
  params: { page?: number; perPage?: number } = {},
  options?: JsonResponseRequestOptions
): Promise<PharmacyOrderManagerCommentsResponse> {
  const response = await localApiRequest<
    ApiSuccessResponse<OrderManagerCommentsResponse>
  >(
    appendQueryParams(PHARMACY_API_ROUTES.orders.comments(orderId), params),
    options
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
  const payload: CreateOrderManagerCommentPayload = { text };
  const response = await localApiRequest<
    ApiSuccessResponse<CreateOrderManagerCommentResponse>
  >(PHARMACY_API_ROUTES.orders.comments(orderId), {
    method: 'POST',
    body: payload,
  });

  const data = getResponseData(response);
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
  params: PharmacyOrderSalesStatisticsQueryParams = {},
  options?: JsonResponseRequestOptions
) {
  const response = await localApiRequest<ApiSuccessResponse<unknown>>(
    appendQueryParams(PHARMACY_API_ROUTES.orders.salesStatistics, params),
    options
  );

  return normalizeOrderSalesStatistics(getResponseData(response));
}
