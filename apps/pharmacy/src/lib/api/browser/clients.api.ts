import 'client-only';

import { buildQueryString, getResponseData } from '@e-pharmacy/api-client/core';
import type { ApiSuccessResponse } from '@e-pharmacy/types';

import { pharmacyApiRoutes as PHARMACY_API_ROUTES } from '@/lib/api/routes/pharmacy-api-routes';

import {
  normalizePharmacyClientsResponse,
  type PharmacyClientsQueryParams,
  type PharmacyClientsResponse,
} from '@/lib/pharmacy/clients';

import { localApiRequest } from './local-api-request';

//===================================================================

export async function getPharmacyClients(
  params: PharmacyClientsQueryParams = {}
): Promise<PharmacyClientsResponse> {
  const response = await localApiRequest<ApiSuccessResponse<unknown>>(
    `${PHARMACY_API_ROUTES.clients.list}${buildQueryString(params)}`
  );

  return normalizePharmacyClientsResponse(getResponseData(response));
}
