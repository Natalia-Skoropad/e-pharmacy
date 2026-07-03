import 'client-only';

import { buildQueryString, getResponseData } from '@e-pharmacy/api-client/core';
import type { ApiSuccessResponse } from '@e-pharmacy/types';

import { pharmacyApiRoutes as PHARMACY_API_ROUTES } from '@/lib/api/routes/pharmacy-api-routes';

import {
  normalizePharmacyProductRequestsResponse,
  type PharmacyProductRequestsQueryParams,
  type PharmacyProductRequestsResponse,
} from '@/lib/product-requests/product-requests';

import { localApiRequest } from '@e-pharmacy/next-api/browser';

//===================================================================

export async function getPharmacyProductRequests(
  params: PharmacyProductRequestsQueryParams = {}
): Promise<PharmacyProductRequestsResponse> {
  const response = await localApiRequest<ApiSuccessResponse<unknown>>(
    `${PHARMACY_API_ROUTES.productRequests.list}${buildQueryString(params)}`
  );

  return normalizePharmacyProductRequestsResponse(getResponseData(response));
}
