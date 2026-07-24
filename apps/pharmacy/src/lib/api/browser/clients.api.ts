import 'client-only';

import { buildQueryString, getResponseData } from '@e-pharmacy/api-client/core';
import type { ApiSuccessResponse } from '@e-pharmacy/types/api';

import { pharmacyApiRoutes as PHARMACY_API_ROUTES } from '@/lib/api/routes/pharmacy-api-routes';

import {
  normalizePharmacyClient,
  normalizePharmacyClientProductsResponse,
  normalizePharmacyClientsResponse,
  type PharmacyClientProductsQueryParams,
  type PharmacyClientProductsResponse,
  type PharmacyClientRow,
  type PharmacyClientsQueryParams,
  type PharmacyClientsResponse,
} from '@/lib/clients/clients';

import { localApiRequest } from '@e-pharmacy/next-api/browser';

//===================================================================

export async function getPharmacyClientDetails(
  clientId: string
): Promise<PharmacyClientRow> {
  const response = await localApiRequest<ApiSuccessResponse<unknown>>(
    PHARMACY_API_ROUTES.clients.details(clientId)
  );

  const data = getResponseData(response);

  const payload =
    data && typeof data === 'object' && 'client' in data
      ? (data as { client?: unknown }).client
      : data;

  const client = normalizePharmacyClient(payload);

  if (!client) throw new Error('Client could not be loaded.');

  return client;
}

//===================================================================

export async function getPharmacyClients(
  params: PharmacyClientsQueryParams = {}
): Promise<PharmacyClientsResponse> {
  const response = await localApiRequest<ApiSuccessResponse<unknown>>(
    `${PHARMACY_API_ROUTES.clients.list}${buildQueryString(params)}`
  );

  return normalizePharmacyClientsResponse(getResponseData(response));
}

//===================================================================

export async function getPharmacyClientProducts(
  clientId: string,
  params: PharmacyClientProductsQueryParams = {}
): Promise<PharmacyClientProductsResponse> {
  const response = await localApiRequest<ApiSuccessResponse<unknown>>(
    `${PHARMACY_API_ROUTES.clients.products(clientId)}${buildQueryString(params)}`
  );

  return normalizePharmacyClientProductsResponse(getResponseData(response));
}
