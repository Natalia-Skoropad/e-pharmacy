import 'client-only';

import { ApiError, appendQueryParams } from '@e-pharmacy/api-client/transport';

import {
  parseApiResponseData,
  type ApiResponseContext,
} from '@e-pharmacy/api-client/response';

import { localApiRequest } from '@e-pharmacy/next-api/browser';
import { isRecord } from '@e-pharmacy/utils/guards';

import { pharmacyApiRoutes as PHARMACY_API_ROUTES } from '@/lib/api/routes/pharmacy-api-routes';

import {
  sanitizeBrowserReadRequestOptions,
  type BrowserReadRequestOptions,
} from './request-options';

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

function parseClientDetailsData(
  value: unknown,
  context?: ApiResponseContext
): PharmacyClientRow {
  const payload = isRecord(value) && 'client' in value ? value.client : value;
  const client = normalizePharmacyClient(payload);

  if (!client) {
    throw new ApiError('Client response does not match its contract.', {
      transportCode: 'INVALID_RESPONSE',
      payload: value,
      ...context,
    });
  }

  return client;
}

//===================================================================

export async function getPharmacyClientDetails(
  clientId: string,
  options?: BrowserReadRequestOptions
): Promise<PharmacyClientRow> {
  const path = PHARMACY_API_ROUTES.clients.details(clientId);

  return parseApiResponseData(
    await localApiRequest(path, sanitizeBrowserReadRequestOptions(options)),
    parseClientDetailsData,
    { url: path, method: 'GET' }
  );
}

//===================================================================

export async function getPharmacyClients(
  params: PharmacyClientsQueryParams = {},
  options?: BrowserReadRequestOptions
): Promise<PharmacyClientsResponse> {
  const path = appendQueryParams(PHARMACY_API_ROUTES.clients.list, params);

  return parseApiResponseData(
    await localApiRequest(path, sanitizeBrowserReadRequestOptions(options)),
    normalizePharmacyClientsResponse,
    { url: path, method: 'GET' }
  );
}

//===================================================================

export async function getPharmacyClientProducts(
  clientId: string,
  params: PharmacyClientProductsQueryParams = {},
  options?: BrowserReadRequestOptions
): Promise<PharmacyClientProductsResponse> {
  const path = appendQueryParams(
    PHARMACY_API_ROUTES.clients.products(clientId),
    params
  );

  return parseApiResponseData(
    await localApiRequest(path, sanitizeBrowserReadRequestOptions(options)),
    normalizePharmacyClientProductsResponse,
    { url: path, method: 'GET' }
  );
}
