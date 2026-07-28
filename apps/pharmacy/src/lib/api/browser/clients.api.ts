import 'client-only';

import {
  appendQueryParams,
  getResponseData,
  type JsonResponseRequestOptions,
} from '@e-pharmacy/api-client/core';

import type { ApiSuccessResponse } from '@e-pharmacy/types/api';
import { localApiRequest } from '@e-pharmacy/next-api/browser';

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

//===================================================================

export async function getPharmacyClientDetails(
  clientId: string,
  options?: JsonResponseRequestOptions
): Promise<PharmacyClientRow> {
  const response = await localApiRequest<ApiSuccessResponse<unknown>>(
    PHARMACY_API_ROUTES.clients.details(clientId),
    options
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
  params: PharmacyClientsQueryParams = {},
  options?: JsonResponseRequestOptions
): Promise<PharmacyClientsResponse> {
  const response = await localApiRequest<ApiSuccessResponse<unknown>>(
    appendQueryParams(PHARMACY_API_ROUTES.clients.list, params),
    options
  );

  return normalizePharmacyClientsResponse(getResponseData(response));
}

//===================================================================

export async function getPharmacyClientProducts(
  clientId: string,
  params: PharmacyClientProductsQueryParams = {},
  options?: JsonResponseRequestOptions
): Promise<PharmacyClientProductsResponse> {
  const response = await localApiRequest<ApiSuccessResponse<unknown>>(
    appendQueryParams(PHARMACY_API_ROUTES.clients.products(clientId), params),
    options
  );

  return normalizePharmacyClientProductsResponse(getResponseData(response));
}
