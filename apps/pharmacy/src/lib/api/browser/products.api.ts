import 'client-only';

import { appendQueryParams } from '@e-pharmacy/api-client/transport';

import {
  parseApiResponseData,
  parsePharmacyProductMutationResponse,
  parseProductDetailsResponse,
  parseProductsWithOffersResponse,
  parseProductStockMovementsResponse,
  parseReviewsResponse,
} from '@e-pharmacy/api-client/response';

import { localApiRequest } from '@e-pharmacy/next-api/browser';
import type { ReviewsResponse } from '@e-pharmacy/types/reviews';

import type {
  PharmacyProductMutationResponse,
  ProductDetails,
  ProductDetailsResponse,
  ProductStockMovementsResponse,
  PharmacyProductsQueryParams as PharmacyProductsApiQueryParams,
  ProductsWithOffersResponse,
} from '@e-pharmacy/types/products';

import { pharmacyApiRoutes as PHARMACY_API_ROUTES } from '@/lib/api/routes/pharmacy-api-routes';

import {
  getOwnProductBackendQuery,
  normalizePharmacyProductsResponse,
  type PharmacyProductsQueryParams,
  type PharmacyProductsResponse,
} from '@/lib/products/products';

import {
  sanitizeBrowserReadRequestOptions,
  type BrowserReadRequestOptions,
} from './request-options';

//===================================================================

export async function getProducts(
  params: PharmacyProductsApiQueryParams = {},
  options: BrowserReadRequestOptions = {}
): Promise<ProductsWithOffersResponse> {
  const path = appendQueryParams(PHARMACY_API_ROUTES.products.list, params);

  return parseApiResponseData(
    await localApiRequest(path, sanitizeBrowserReadRequestOptions(options)),
    parseProductsWithOffersResponse,
    { url: path, method: 'GET' }
  );
}

//===================================================================

export async function getPharmacyProducts(
  params: PharmacyProductsQueryParams = {},
  options?: BrowserReadRequestOptions
): Promise<PharmacyProductsResponse> {
  const path = appendQueryParams(
    PHARMACY_API_ROUTES.products.list,
    getOwnProductBackendQuery(params)
  );

  return parseApiResponseData(
    await localApiRequest(path, sanitizeBrowserReadRequestOptions(options)),
    (value) => normalizePharmacyProductsResponse(value, params.pharmacyId),
    { url: path, method: 'GET' }
  );
}

//===================================================================

export async function getProductDetails(
  productId: ProductDetails['id'],
  options?: BrowserReadRequestOptions
): Promise<ProductDetailsResponse> {
  const path = PHARMACY_API_ROUTES.products.details(productId);

  return parseApiResponseData(
    await localApiRequest(path, sanitizeBrowserReadRequestOptions(options)),
    parseProductDetailsResponse,
    { url: path, method: 'GET' }
  );
}

//===================================================================

export async function addProductToMyPharmacy(
  productId: ProductDetails['id']
): Promise<PharmacyProductMutationResponse> {
  const path = PHARMACY_API_ROUTES.products.myPharmacy(productId);

  return parseApiResponseData(
    await localApiRequest(path, { method: 'POST' }),
    parsePharmacyProductMutationResponse,
    { url: path, method: 'POST' }
  );
}

//===================================================================

export async function removeProductFromMyPharmacy(
  productId: ProductDetails['id']
): Promise<PharmacyProductMutationResponse> {
  const path = PHARMACY_API_ROUTES.products.myPharmacy(productId);

  return parseApiResponseData(
    await localApiRequest(path, { method: 'DELETE' }),
    parsePharmacyProductMutationResponse,
    { url: path, method: 'DELETE' }
  );
}

//===================================================================

export async function getProductStockMovements(
  productId: ProductDetails['id'],
  options?: BrowserReadRequestOptions
): Promise<ProductStockMovementsResponse> {
  const path = PHARMACY_API_ROUTES.products.stockMovements(productId);

  return parseApiResponseData(
    await localApiRequest(path, sanitizeBrowserReadRequestOptions(options)),
    parseProductStockMovementsResponse,
    { url: path, method: 'GET' }
  );
}

//===================================================================

export async function getProductReviews(
  productId: ProductDetails['id'],
  options?: BrowserReadRequestOptions
): Promise<ReviewsResponse> {
  const path = PHARMACY_API_ROUTES.products.reviews(productId);

  return parseApiResponseData(
    await localApiRequest(path, sanitizeBrowserReadRequestOptions(options)),
    parseReviewsResponse,
    { url: path, method: 'GET' }
  );
}
