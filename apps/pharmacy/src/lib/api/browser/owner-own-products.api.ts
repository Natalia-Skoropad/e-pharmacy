import 'client-only';

import { appendQueryParams } from '@e-pharmacy/api-client/transport';
import { localApiRequest } from '@e-pharmacy/next-api/browser';

import {
  parseApiResponseData,
  parseProductsWithOffersResponse,
  parsePharmacyProductMutationResponse,
} from '@e-pharmacy/api-client/response';

import type {
  PharmacyProductsQueryParams,
  ProductsWithOffersResponse,
} from '@e-pharmacy/types/products';

import { normalizePharmacyProductsResponse } from '@/lib/products/products';
import { pharmacyApiRoutes as PHARMACY_API_ROUTES } from '@/lib/api/routes/pharmacy-api-routes';

import type { BrowserReadRequestOptions } from './request-options';
import { sanitizeBrowserReadRequestOptions } from './request-options';

//===================================================================

export async function getOwnerOwnProducts(
  params: PharmacyProductsQueryParams,
  options?: BrowserReadRequestOptions
) {
  const path = appendQueryParams(PHARMACY_API_ROUTES.products.list, {
    ...params,
    ownerProducts: true,
    includeBlocked: true,
  });

  return parseApiResponseData(
    await localApiRequest(path, sanitizeBrowserReadRequestOptions(options)),

    (value) =>
      normalizePharmacyProductsResponse(value, params.pharmacyId, true),
    { url: path, method: 'GET' }
  );
}

//===================================================================

export async function getOwnerOwnProductSuggestions(
  params: PharmacyProductsQueryParams,
  options?: BrowserReadRequestOptions
): Promise<ProductsWithOffersResponse> {
  const path = appendQueryParams(PHARMACY_API_ROUTES.products.list, {
    ...params,
    ownerProducts: true,
    includeBlocked: true,
  });

  return parseApiResponseData(
    await localApiRequest(path, sanitizeBrowserReadRequestOptions(options)),

    parseProductsWithOffersResponse,

    { url: path, method: 'GET' }
  );
}

//===================================================================

/** Removes the owner-wide selection, never an individual pharmacy offer. */
export async function removeOwnerOwnProduct(productId: string) {
  const path = appendQueryParams(
    PHARMACY_API_ROUTES.products.myPharmacy(productId),
    {
      ownerProducts: true,
    }
  );

  return parseApiResponseData(
    await localApiRequest(path, {
      method: 'DELETE',
    }),

    parsePharmacyProductMutationResponse,

    { url: path, method: 'DELETE' }
  );
}
