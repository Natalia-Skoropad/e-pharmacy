import 'client-only';

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

import { clientApiRoutes as ROUTES } from '@/lib/api/routes/client-api-routes';

import type {
  MutationRequestOptions,
  ReadRequestOptions,
} from '@/lib/api/request-options';

//===================================================================

export async function checkoutOrder(
  payload: CheckoutOrderPayload,
  options: MutationRequestOptions = {}
): Promise<CheckoutOrderResponse> {
  const path = ROUTES.orders.checkout;

  return parseApiResponseData(
    await localApiRequest(path, { ...options, method: 'POST', body: payload }),
    parseCheckoutOrderResponse,
    { url: path, method: 'POST' }
  );
}

//===================================================================

export async function getOrders(
  options?: ReadRequestOptions
): Promise<ClientOrdersResponse> {
  const path = ROUTES.orders.list;

  return parseApiResponseData(
    await localApiRequest(path, options),
    parseClientOrdersResponse,
    { url: path, method: 'GET' }
  );
}

//===================================================================

export async function getOrderDetails(
  orderId: string,
  options?: ReadRequestOptions
): Promise<ClientOrderDetailsResponse> {
  const path = ROUTES.orders.details(orderId);

  return parseApiResponseData(
    await localApiRequest(path, options),
    parseClientOrderDetailsResponse,
    { url: path, method: 'GET' }
  );
}
