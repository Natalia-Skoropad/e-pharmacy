import 'client-only';

import { localApiRequest } from '@e-pharmacy/next-api/browser';
import { appendQueryParams } from '@e-pharmacy/api-client/transport';

import {
  parseApiResponseData,
  parseProductDetailsResponse,
  parseProductsWithOffersResponse,
  parsePharmacyProductMutationResponse,
  parseReviewsResponse,
} from '@e-pharmacy/api-client/response';

import type { PharmacyProductsQueryParams } from '@e-pharmacy/types/products';

import { normalizeAllProductStatisticsResponse } from '@/lib/products/products';
import { pharmacyApiRoutes } from '@/lib/api/routes/pharmacy-api-routes';

import type { BrowserReadRequestOptions } from './request-options';
import { sanitizeBrowserReadRequestOptions } from './request-options';

//===================================================================

export async function getOwnerCatalogProducts(
  params: PharmacyProductsQueryParams,
  options?: BrowserReadRequestOptions
) {
  const path = appendQueryParams(pharmacyApiRoutes.products.list, {
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
  const path = appendQueryParams(pharmacyApiRoutes.products.statistics, {
    ownerCatalog: true,
  });

  return parseApiResponseData(
    await localApiRequest(path, sanitizeBrowserReadRequestOptions(options)),

    normalizeAllProductStatisticsResponse,

    { url: path, method: 'GET' }
  );
}

//===================================================================

export async function addOwnerCatalogProduct(productId: string) {
  const path = appendQueryParams(
    pharmacyApiRoutes.products.myPharmacy(productId),
    { ownerCatalog: true }
  );

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
  const path = appendQueryParams(
    pharmacyApiRoutes.products.details(productId),
    {
      ownerCatalog: true,
    }
  );

  return parseApiResponseData(
    await localApiRequest(path, sanitizeBrowserReadRequestOptions(options)),

    parseProductDetailsResponse,

    { url: path, method: 'GET' }
  );
}

//===================================================================

/** Approved reviews in the owner-wide Admin catalog (no selected pharmacy). */
export async function getOwnerCatalogProductReviews(
  productId: string,
  options?: BrowserReadRequestOptions
) {
  const path = pharmacyApiRoutes.products.ownerReviews(productId);

  return parseApiResponseData(
    await localApiRequest(path, sanitizeBrowserReadRequestOptions(options)),

    parseReviewsResponse,

    { url: path, method: 'GET' }
  );
}
