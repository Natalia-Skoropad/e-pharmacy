import 'client-only';

import { ApiError, appendQueryParams } from '@e-pharmacy/api-client/transport';

import {
  normalizeOrderSalesStatistics,
  type OrderSalesStatisticsQueryParams,
} from '@e-pharmacy/api-client/response';

import type {
  OrderSalesStatistics,
  OrderStatisticsCounts,
} from '@e-pharmacy/types/orders';

import type {
  OwnedPharmacyListItem,
  OwnedPharmacyListResponse,
} from '@e-pharmacy/types/pharmacies';

import {
  parseApiResponseData,
  parseOwnedPharmacyListResponse,
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
import type { OwnedPharmacyRegistryQuery } from './owned-pharmacy-registry.api';

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

export type ClientPharmacyOrderSummary = Readonly<
  OwnedPharmacyListItem & {
    pharmacyId: string;
    pharmacyName: string;
    firstOrderAt: string | null;
    lastOrderAt: string | null;
    ordersCount: number;
    successfulOrdersAmount: number;
  }
>;

//===============================================================

export type ClientPharmaciesResponse = Readonly<
  Omit<OwnedPharmacyListResponse, 'items'> & {
    items: readonly ClientPharmacyOrderSummary[];
  }
>;

//===================================================================

/** Client-specific registry with server-side filtering and pagination. */
export async function getClientPharmacies(
  clientId: string,
  params: OwnedPharmacyRegistryQuery = {},
  options?: BrowserReadRequestOptions
): Promise<ClientPharmaciesResponse> {
  const path = appendQueryParams(
    PHARMACY_API_ROUTES.clients.pharmacies(clientId),
    params
  );

  return parseApiResponseData(
    await localApiRequest(path, sanitizeBrowserReadRequestOptions(options)),

    (payload: unknown): ClientPharmaciesResponse => {
      if (!isRecord(payload) || !Array.isArray(payload.items)) {
        throw new ApiError('Invalid client pharmacies response.', {
          transportCode: 'INVALID_RESPONSE',
        });
      }

      const rawItems = payload.items as unknown[];

      const normalized = parseOwnedPharmacyListResponse({
        ...payload,

        items: rawItems.map((row: unknown) => {
          if (!isRecord(row)) {
            throw new TypeError('Invalid client pharmacy row.');
          }

          return {
            ...row,
            id: row.pharmacyId,
            name: row.pharmacyName,
            membershipRole: 'owner',
            addedProductsCount: 0,
            activeClientsCount: 0,
            successfulRevenue: row.successfulOrdersAmount,
          };
        }),
      });

      return {
        ...normalized,

        items: normalized.items.map((item, index) => {
          const row = rawItems[index];

          if (!isRecord(row)) {
            throw new TypeError('Invalid client pharmacy row.');
          }

          if (
            !Number.isSafeInteger(row.ordersCount) ||
            Number(row.ordersCount) < 0 ||
            (row.firstOrderAt !== null &&
              (typeof row.firstOrderAt !== 'string' ||
                !Number.isFinite(Date.parse(row.firstOrderAt)))) ||
            (row.lastOrderAt !== null &&
              (typeof row.lastOrderAt !== 'string' ||
                !Number.isFinite(Date.parse(row.lastOrderAt))))
          ) {
            throw new TypeError('Invalid client pharmacy order metrics.');
          }

          return {
            ...item,
            pharmacyId: item.id,
            pharmacyName: item.name,
            firstOrderAt: row.firstOrderAt as string | null,
            lastOrderAt: row.lastOrderAt as string | null,
            ordersCount: row.ordersCount as number,
            successfulOrdersAmount: item.successfulRevenue ?? 0,
          };
        }),
      };
    },
    { url: path, method: 'GET' }
  );
}

//===================================================================

/** Owner-authorized counters across every accessible pharmacy for this client. */
export async function getPharmacyClientOrderStatistics(
  clientId: string,
  options?: BrowserReadRequestOptions
): Promise<OrderStatisticsCounts> {
  const path = PHARMACY_API_ROUTES.clients.orderStatistics(clientId);

  return parseApiResponseData(
    await localApiRequest(path, sanitizeBrowserReadRequestOptions(options)),

    (value: unknown): OrderStatisticsCounts => {
      if (!isRecord(value)) {
        throw new ApiError('Invalid client order statistics.', {
          transportCode: 'INVALID_RESPONSE',
        });
      }

      const statuses = [
        'new',
        'in_progress',
        'successful',
        'rejected',
      ] as const;

      const counts = {} as Record<
        (typeof statuses)[number],
        { count: number; amount: number }
      >;

      for (const status of statuses) {
        const item = value[status];

        if (
          !isRecord(item) ||
          typeof item.count !== 'number' ||
          !Number.isSafeInteger(item.count) ||
          item.count < 0 ||
          typeof item.amount !== 'number' ||
          !Number.isFinite(item.amount) ||
          item.amount < 0
        ) {
          throw new ApiError('Invalid client order statistics.', {
            transportCode: 'INVALID_RESPONSE',
          });
        }

        counts[status] = { count: item.count, amount: item.amount };
      }

      return counts;
    },

    { url: path, method: 'GET' }
  );
}

//===================================================================

/** Sales categories are calculated for this client, never for unrelated customers. */
export async function getPharmacyClientSalesStatistics(
  clientId: string,
  params: OrderSalesStatisticsQueryParams = {},
  options?: BrowserReadRequestOptions
): Promise<OrderSalesStatistics> {
  const path = appendQueryParams(
    PHARMACY_API_ROUTES.clients.salesStatistics(clientId),
    params
  );

  return parseApiResponseData(
    await localApiRequest(path, sanitizeBrowserReadRequestOptions(options)),

    normalizeOrderSalesStatistics,

    { url: path, method: 'GET' }
  );
}
