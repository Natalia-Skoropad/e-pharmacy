import 'client-only';

import { localApiRequest } from '@e-pharmacy/next-api/browser';
import { appendQueryParams } from '@e-pharmacy/api-client/transport';

import {
  parseApiResponseData,
  parseProductDetailsResponse,
  parseProductsWithOffersResponse,
  parsePharmacyProductMutationResponse,
} from '@e-pharmacy/api-client/response';

import type { PharmacyProductsQueryParams } from '@e-pharmacy/types/products';

import { normalizeAllProductStatisticsResponse } from '@/lib/products/products';

import type { BrowserReadRequestOptions } from './request-options';
import { sanitizeBrowserReadRequestOptions } from './request-options';

//===================================================================

export async function getOwnerCatalogProducts(
  params: PharmacyProductsQueryParams,
  options?: BrowserReadRequestOptions
) {
  const path = appendQueryParams('/api/products', {
    ...params,
    ownerCatalog: true,
  });

  return parseApiResponseData(
    await localApiRequest(path, sanitizeBrowserReadRequestOptions(options)),

    parseProductsWithOffersResponse,

    { url: path, method: 'GET' }
  );
}

//===================================================================

export async function getOwnerCatalogStatistics(
  options?: BrowserReadRequestOptions
) {
  const path = '/api/products/statistics?ownerCatalog=true';

  return parseApiResponseData(
    await localApiRequest(path, sanitizeBrowserReadRequestOptions(options)),

    normalizeAllProductStatisticsResponse,

    { url: path, method: 'GET' }
  );
}

//===================================================================

export async function addOwnerCatalogProduct(productId: string) {
  const path = `/api/products/${encodeURIComponent(productId)}/my-pharmacy?ownerCatalog=true`;

  return parseApiResponseData(
    await localApiRequest(path, { method: 'POST' }),

    parsePharmacyProductMutationResponse,

    { url: path, method: 'POST' }
  );
}

//===================================================================

export async function getOwnerCatalogProductDetails(
  productId: string,
  options?: BrowserReadRequestOptions
) {
  const path = `/api/products/${encodeURIComponent(productId)}?ownerCatalog=true`;

  return parseApiResponseData(
    await localApiRequest(path, sanitizeBrowserReadRequestOptions(options)),

    parseProductDetailsResponse,

    { url: path, method: 'GET' }
  );
}
