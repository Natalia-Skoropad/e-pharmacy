import 'client-only';

import { buildQueryString, getResponseData } from '@e-pharmacy/api-client/core';
import type { ApiSuccessResponse } from '@e-pharmacy/types';

import { pharmacyApiRoutes as PHARMACY_API_ROUTES } from '@/lib/api/routes/pharmacy-api-routes';

import {
  normalizePharmacyOrdersResponse,
  type PharmacyOrdersQueryParams,
  type PharmacyOrdersResponse,
} from '@/lib/orders/orders';

import { localApiRequest } from './local-api-request';

//===================================================================

export async function getPharmacyOrders(
  params: PharmacyOrdersQueryParams = {}
): Promise<PharmacyOrdersResponse> {
  const response = await localApiRequest<ApiSuccessResponse<unknown>>(
    `${PHARMACY_API_ROUTES.orders.list}${buildQueryString(params)}`
  );

  return normalizePharmacyOrdersResponse(getResponseData(response));
}
