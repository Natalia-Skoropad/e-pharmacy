import 'client-only';

import {
  appendQueryParams,
  type JsonResponseRequestOptions,
} from '@e-pharmacy/api-client/transport';

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

//===================================================================

export async function getProducts(
  params: PharmacyProductsApiQueryParams = {},
  options: JsonResponseRequestOptions = {}
): Promise<ProductsWithOffersResponse> {
  const path = appendQueryParams(PHARMACY_API_ROUTES.products.list, params);

  return parseApiResponseData(
    await localApiRequest(path, options),
    parseProductsWithOffersResponse,
    { url: path, method: 'GET' }
  );
}

//===================================================================

export async function getPharmacyProducts(
  params: PharmacyProductsQueryParams = {},
  options?: JsonResponseRequestOptions
): Promise<PharmacyProductsResponse> {
  const path = appendQueryParams(
    PHARMACY_API_ROUTES.products.list,
    getOwnProductBackendQuery(params)
  );

  return parseApiResponseData(
    await localApiRequest(path, options),
    (value) => normalizePharmacyProductsResponse(value, params.pharmacyId),
    { url: path, method: 'GET' }
  );
}

//===================================================================

export async function getProductDetails(
  productId: ProductDetails['id'],
  options?: JsonResponseRequestOptions
): Promise<ProductDetailsResponse> {
  const path = PHARMACY_API_ROUTES.products.details(productId);

  return parseApiResponseData(
    await localApiRequest(path, options),
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
  options?: JsonResponseRequestOptions
): Promise<ProductStockMovementsResponse> {
  const path = PHARMACY_API_ROUTES.products.stockMovements(productId);

  return parseApiResponseData(
    await localApiRequest(path, options),
    parseProductStockMovementsResponse,
    { url: path, method: 'GET' }
  );
}

//===================================================================

export async function getProductReviews(
  productId: ProductDetails['id'],
  options?: JsonResponseRequestOptions
): Promise<ReviewsResponse> {
  const path = PHARMACY_API_ROUTES.products.reviews(productId);

  return parseApiResponseData(
    await localApiRequest(path, options),
    parseReviewsResponse,
    { url: path, method: 'GET' }
  );
}
