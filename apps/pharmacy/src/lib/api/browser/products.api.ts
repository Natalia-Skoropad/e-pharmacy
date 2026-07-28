import 'client-only';

import {
  buildQueryString,
  getResponseData,
  type JsonResponseRequestOptions,
} from '@e-pharmacy/api-client/core';

import { localApiRequest } from '@e-pharmacy/next-api/browser';

import type { ApiSuccessResponse } from '@e-pharmacy/types/api';
import type { ReviewsResponse } from '@e-pharmacy/types/reviews';

import type {
  PharmacyProductMutationResponse,
  ProductDetails,
  ProductDetailsResponse,
  ProductStockMovementsResponse,
  PharmacyProductsQueryParams as PharmacyProductsApiQueryParams,
  ProductsResponse,
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
): Promise<ProductsResponse> {
  const response = await localApiRequest<ApiSuccessResponse<ProductsResponse>>(
    `${PHARMACY_API_ROUTES.products.list}${buildQueryString(params)}`,
    options
  );

  return getResponseData(response);
}

//===================================================================

export async function getPharmacyProducts(
  params: PharmacyProductsQueryParams = {},
  options?: JsonResponseRequestOptions
): Promise<PharmacyProductsResponse> {
  const response = await localApiRequest<ApiSuccessResponse<unknown>>(
    `${PHARMACY_API_ROUTES.products.list}${buildQueryString(
      getOwnProductBackendQuery(params)
    )}`,
    options
  );

  return normalizePharmacyProductsResponse(
    getResponseData(response),
    params.pharmacyId
  );
}

//===================================================================

export async function getProductDetails(
  productId: ProductDetails['id'],
  options?: JsonResponseRequestOptions
): Promise<ProductDetailsResponse> {
  const response = await localApiRequest<
    ApiSuccessResponse<ProductDetailsResponse>
  >(PHARMACY_API_ROUTES.products.details(productId), options);

  return getResponseData(response);
}

//===================================================================

export async function addProductToMyPharmacy(
  productId: ProductDetails['id']
): Promise<PharmacyProductMutationResponse> {
  const response = await localApiRequest<
    ApiSuccessResponse<PharmacyProductMutationResponse>
  >(PHARMACY_API_ROUTES.products.myPharmacy(productId), {
    method: 'POST',
  });

  return getResponseData(response);
}

//===================================================================

export async function removeProductFromMyPharmacy(
  productId: ProductDetails['id']
): Promise<PharmacyProductMutationResponse> {
  const response = await localApiRequest<
    ApiSuccessResponse<PharmacyProductMutationResponse>
  >(PHARMACY_API_ROUTES.products.myPharmacy(productId), {
    method: 'DELETE',
  });

  return getResponseData(response);
}

//===================================================================

export async function getProductStockMovements(
  productId: ProductDetails['id'],
  options?: JsonResponseRequestOptions
): Promise<ProductStockMovementsResponse> {
  const response = await localApiRequest<
    ApiSuccessResponse<ProductStockMovementsResponse>
  >(PHARMACY_API_ROUTES.products.stockMovements(productId), options);

  return getResponseData(response);
}

//===================================================================

export async function getProductReviews(
  productId: ProductDetails['id'],
  options?: JsonResponseRequestOptions
): Promise<ReviewsResponse> {
  const response = await localApiRequest<
    ApiSuccessResponse<ReviewsResponse>
  >(PHARMACY_API_ROUTES.products.reviews(productId), options);

  return getResponseData(response);
}
