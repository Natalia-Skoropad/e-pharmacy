import 'client-only';

import {
  ApiError,
  appendQueryParams,
  type JsonResponseRequestOptions,
} from '@e-pharmacy/api-client/transport';

import {
  parseApiResponseData,
  parseMessageResponse,
  type ApiResponseContext,
} from '@e-pharmacy/api-client/response';

import { localApiRequest } from '@e-pharmacy/next-api/browser';
import { isRecord } from '@e-pharmacy/utils/guards';

import type {
  CreateOrderManagerCommentPayload,
  DeliveryMethod,
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

function parseOrderData(
  value: unknown,
  context?: ApiResponseContext
): PharmacyOrderDetails {
  const payload = isRecord(value) ? value.order : undefined;
  const order = normalizePharmacyOrderDetails(payload);

  if (!order) {
    throw new ApiError('Order response does not match its contract.', {
      transportCode: 'INVALID_RESPONSE',
      payload: value,
      ...context,
    });
  }

  return order;
}

//===================================================================

function parseCreatedComment(
  value: unknown,
  context?: ApiResponseContext
): PharmacyOrderManagerComment {
  const payload = isRecord(value) ? value.comment : undefined;
  const comment = normalizePharmacyOrderManagerComment(payload);

  if (!comment) {
    throw new ApiError('Order comment response does not match its contract.', {
      transportCode: 'INVALID_RESPONSE',
      payload: value,
      ...context,
    });
  }

  return comment;
}

//===================================================================

export async function createPharmacyOrder(
  payload: CreatePharmacyOrderPayload
): Promise<PharmacyOrderDetails> {
  const path = PHARMACY_API_ROUTES.orders.list;

  return parseApiResponseData(
    await localApiRequest(path, { method: 'POST', body: payload }),
    parseOrderData,
    { url: path, method: 'POST' }
  );
}

//===================================================================

export async function getPharmacyOrders(
  params: PharmacyOrdersQueryParams = {},
  options?: JsonResponseRequestOptions
): Promise<PharmacyOrdersResponse> {
  const path = appendQueryParams(PHARMACY_API_ROUTES.orders.list, params);

  return parseApiResponseData(
    await localApiRequest(path, options),
    normalizePharmacyOrdersResponse,
    { url: path, method: 'GET' }
  );
}

//===================================================================

export async function getPharmacyOrderDetails(
  orderId: string,
  options?: JsonResponseRequestOptions
): Promise<PharmacyOrderDetails> {
  const path = PHARMACY_API_ROUTES.orders.details(orderId);

  return parseApiResponseData(
    await localApiRequest(path, options),
    parseOrderData,
    { url: path, method: 'GET' }
  );
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
  const path = PHARMACY_API_ROUTES.orders.details(orderId);

  return parseApiResponseData(
    await localApiRequest(path, { method: 'PATCH', body: payload }),
    parseOrderData,
    { url: path, method: 'PATCH' }
  );
}

//===================================================================

export async function updatePharmacyOrderStatus(
  orderId: string,
  payload: UpdateOrderStatusPayload
): Promise<PharmacyOrderDetails> {
  const path = PHARMACY_API_ROUTES.orders.status(orderId);

  return parseApiResponseData(
    await localApiRequest(path, { method: 'PATCH', body: payload }),
    parseOrderData,
    { url: path, method: 'PATCH' }
  );
}

//===================================================================

export async function getPharmacyOrderComments(
  orderId: string,
  params: { page?: number; perPage?: number } = {},
  options?: JsonResponseRequestOptions
): Promise<PharmacyOrderManagerCommentsResponse> {
  const path = appendQueryParams(
    PHARMACY_API_ROUTES.orders.comments(orderId),
    params
  );

  return parseApiResponseData(
    await localApiRequest(path, options),
    normalizePharmacyOrderManagerCommentsResponse,
    { url: path, method: 'GET' }
  );
}

//===================================================================

export async function createPharmacyOrderComment(
  orderId: string,
  text: string
): Promise<PharmacyOrderManagerComment> {
  const path = PHARMACY_API_ROUTES.orders.comments(orderId);
  const payload: CreateOrderManagerCommentPayload = { text };

  return parseApiResponseData(
    await localApiRequest(path, { method: 'POST', body: payload }),
    parseCreatedComment,
    { url: path, method: 'POST' }
  );
}

//===================================================================

export async function deletePharmacyOrderComment(
  orderId: string,
  commentId: string
): Promise<void> {
  const path = PHARMACY_API_ROUTES.orders.comment(orderId, commentId);
  parseApiResponseData(
    await localApiRequest(path, { method: 'DELETE' }),
    parseMessageResponse,
    { url: path, method: 'DELETE' }
  );
}

//===================================================================

export async function getPharmacyOrderSalesStatistics(
  params: PharmacyOrderSalesStatisticsQueryParams = {},
  options?: JsonResponseRequestOptions
) {
  const path = appendQueryParams(
    PHARMACY_API_ROUTES.orders.salesStatistics,
    params
  );

  return parseApiResponseData(
    await localApiRequest(path, options),
    normalizeOrderSalesStatistics,
    { url: path, method: 'GET' }
  );
}
