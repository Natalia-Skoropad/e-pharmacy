import 'client-only';

import type { JsonResponseRequestOptions } from '@e-pharmacy/api-client/transport';

import {
  parseApiResponseData,
  parseCheckoutOrderResponse,
  parseClientOrderDetailsResponse,
  parseClientOrdersResponse,
} from '@e-pharmacy/api-client/response';

import { localApiRequest } from '@e-pharmacy/next-api/browser';

import type {
  CheckoutOrderPayload,
  CheckoutOrderResponse,
  ClientOrderDetailsResponse,
  ClientOrdersResponse,
} from '@e-pharmacy/types/orders';

import { clientApiRoutes as CLIENT_API_ROUTES } from '@/lib/api/routes';

//===================================================================

export async function checkoutOrder(
  payload: CheckoutOrderPayload,
  options: JsonResponseRequestOptions = {}
): Promise<CheckoutOrderResponse> {
  const path = CLIENT_API_ROUTES.orders.checkout;

  return parseApiResponseData(
    await localApiRequest(path, { ...options, method: 'POST', body: payload }),
    parseCheckoutOrderResponse,
    { url: path, method: 'POST' }
  );
}

//===================================================================

export async function getOrders(
  options?: JsonResponseRequestOptions
): Promise<ClientOrdersResponse> {
  const path = CLIENT_API_ROUTES.orders.list;

  return parseApiResponseData(
    await localApiRequest(path, options),
    parseClientOrdersResponse,
    { url: path, method: 'GET' }
  );
}

//===================================================================

export async function getOrderDetails(
  orderId: string,
  options?: JsonResponseRequestOptions
): Promise<ClientOrderDetailsResponse> {
  const path = CLIENT_API_ROUTES.orders.details(orderId);

  return parseApiResponseData(
    await localApiRequest(path, options),
    parseClientOrderDetailsResponse,
    { url: path, method: 'GET' }
  );
}
