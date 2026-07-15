import 'client-only';

import { buildQueryString, getResponseData } from '@e-pharmacy/api-client/core';
import type { ApiSuccessResponse } from '@e-pharmacy/types';

import { pharmacyApiRoutes as PHARMACY_API_ROUTES } from '@/lib/api/routes/pharmacy-api-routes';

import {
  normalizePharmacyClient,
  normalizePharmacyClientsResponse,
  type PharmacyClientRow,
  type PharmacyClientsQueryParams,
  type PharmacyClientsResponse,
} from '@/lib/clients/clients';

import { localApiRequest } from '@e-pharmacy/next-api/browser';

//===================================================================


export async function getPharmacyClientDetails(clientId: string): Promise<PharmacyClientRow> {
  const response = await localApiRequest<ApiSuccessResponse<unknown>>(
    PHARMACY_API_ROUTES.clients.details(clientId)
  );
  const data = getResponseData(response) as { client?: unknown };
  const client = normalizePharmacyClient(data.client);
  if (!client) throw new Error('Client could not be loaded.');
  return client;
}

export async function getPharmacyClients(
  params: PharmacyClientsQueryParams = {}
): Promise<PharmacyClientsResponse> {
  const response = await localApiRequest<ApiSuccessResponse<unknown>>(
    `${PHARMACY_API_ROUTES.clients.list}${buildQueryString(params)}`
  );

  return normalizePharmacyClientsResponse(getResponseData(response));
}
