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

import { operationalLocalApiRequest } from './operational-request';

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
  const path = appendQueryParams(
    PHARMACY_API_ROUTES.clients.details(clientId),
    { scope: 'owner' }
  );

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

  const response = parseApiResponseData(
    await (
      params.scope === 'owner' ? localApiRequest : operationalLocalApiRequest
    )(path, sanitizeBrowserReadRequestOptions(options)),

    normalizePharmacyClientsResponse,

    { url: path, method: 'GET' }
  );

  return response;
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
    await operationalLocalApiRequest(
      path,
      sanitizeBrowserReadRequestOptions(options)
    ),

    normalizePharmacyClientProductsResponse,

    { url: path, method: 'GET' }
  );
}

//===============================================================

export type ClientPharmacyOrderSummary = Readonly<{
  pharmacyId: string;
  pharmacyName: string;
  firstOrderAt: string;
  lastOrderAt: string;
  ordersCount: number;
  successfulOrdersCount: number;
  successfulOrdersAmount: number;
}>;

//===================================================================

export async function getClientPharmacies(
  clientId: string,
  options?: BrowserReadRequestOptions
): Promise<readonly ClientPharmacyOrderSummary[]> {
  const path = PHARMACY_API_ROUTES.clients.pharmacies(clientId);

  return parseApiResponseData(
    await localApiRequest(path, sanitizeBrowserReadRequestOptions(options)),

    (payload: unknown): readonly ClientPharmacyOrderSummary[] => {
      if (!isRecord(payload) || !Array.isArray(payload.items)) {
        throw new ApiError('Invalid client pharmacies response.', {
          transportCode: 'INVALID_RESPONSE',
        });
      }

      return payload.items.map((item: unknown) => {
        if (
          !isRecord(item) ||
          typeof item.pharmacyId !== 'string' ||
          !/^[a-f\d]{24}$/i.test(item.pharmacyId) ||
          typeof item.pharmacyName !== 'string' ||
          !item.pharmacyName.trim() ||
          typeof item.firstOrderAt !== 'string' ||
          typeof item.lastOrderAt !== 'string' ||
          !Number.isSafeInteger(item.ordersCount) ||
          Number(item.ordersCount) < 0 ||
          !Number.isSafeInteger(item.successfulOrdersCount) ||
          Number(item.successfulOrdersCount) < 0 ||
          typeof item.successfulOrdersAmount !== 'number' ||
          !Number.isFinite(item.successfulOrdersAmount) ||
          item.successfulOrdersAmount < 0
        ) {
          throw new ApiError('Invalid client pharmacy row.', {
            transportCode: 'INVALID_RESPONSE',
          });
        }

        return {
          pharmacyId: item.pharmacyId as string,
          pharmacyName: item.pharmacyName as string,
          firstOrderAt: item.firstOrderAt as string,
          lastOrderAt: item.lastOrderAt as string,
          ordersCount: item.ordersCount as number,
          successfulOrdersCount: item.successfulOrdersCount as number,
          successfulOrdersAmount: item.successfulOrdersAmount as number,
        };
      });
    },

    { url: path, method: 'GET' }
  );
}
