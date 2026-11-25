import 'client-only';

import {
  parseApiResponseData,
  parseAdminPharmacyRegistryOwnerOptionsResponse,
  parseProductCategoryReferencesResponse,
} from '@e-pharmacy/api-client/response';

import { appendQueryParams } from '@e-pharmacy/api-client/transport';
import { localApiRequest } from '@e-pharmacy/next-api/browser';

import { adminApiRoutes } from '@/lib/api/routes/admin-api-routes';

import {
  normalizeProductRequestsResponse,
  normalizeProductRequestStatisticsResponse,
  type ProductRequestsQueryParams,
} from '@/lib/product-requests/admin-product-requests';

//===================================================================

type ReadOptions = Readonly<{ signal?: AbortSignal }>;

//===================================================================

export async function getAdminProductRequests(
  params: ProductRequestsQueryParams = {},
  options?: ReadOptions
) {
  const path = appendQueryParams(adminApiRoutes.productRequests.list, params);

  return parseApiResponseData(
    await localApiRequest(path, { signal: options?.signal }),

    normalizeProductRequestsResponse
  );
}

//===================================================================

export async function getAdminProductRequestStatistics(options?: ReadOptions) {
  return parseApiResponseData(
    await localApiRequest(adminApiRoutes.productRequests.statistics, {
      signal: options?.signal,
    }),

    normalizeProductRequestStatisticsResponse
  );
}

//===================================================================

export async function getAdminProductRequestCategories(options?: ReadOptions) {
  return parseApiResponseData(
    await localApiRequest(adminApiRoutes.productRequests.categories, {
      signal: options?.signal,
    }),

    parseProductCategoryReferencesResponse
  );
}

//===================================================================

export async function getAdminProductRequestOwnerOptions(
  params: ProductRequestsQueryParams = {},
  options?: ReadOptions
) {
  const path = appendQueryParams(
    adminApiRoutes.productRequests.ownerOptions,
    params
  );

  return parseApiResponseData(
    await localApiRequest(path, { signal: options?.signal }),

    parseAdminPharmacyRegistryOwnerOptionsResponse
  );
}
