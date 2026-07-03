import 'client-only';

import { buildQueryString, getResponseData } from '@e-pharmacy/api-client/core';

import type {
  ApiSuccessResponse,
  Product,
  ProductDetailsResponse,
  ProductReviewsResponse,
  ProductsQueryParams,
  ProductsResponse,
} from '@e-pharmacy/types';

import { pharmacyApiRoutes as PHARMACY_API_ROUTES } from '@/lib/api/routes/pharmacy-api-routes';

import {
  getOwnProductBackendQuery,
  normalizePharmacyProductsResponse,
  type PharmacyProductsQueryParams,
  type PharmacyProductsResponse,
} from '@/lib/products/products';

import { localApiRequest } from '@e-pharmacy/next-api/browser';

//===================================================================

export async function getProducts(
  params: ProductsQueryParams = {}
): Promise<ProductsResponse> {
  const response = await localApiRequest<ApiSuccessResponse<ProductsResponse>>(
    `${PHARMACY_API_ROUTES.products.list}${buildQueryString(params)}`
  );

  return getResponseData(response);
}

//===================================================================

export async function getPharmacyProducts(
  params: PharmacyProductsQueryParams = {}
): Promise<PharmacyProductsResponse> {
  const response = await localApiRequest<ApiSuccessResponse<unknown>>(
    `${PHARMACY_API_ROUTES.products.list}${buildQueryString(
      getOwnProductBackendQuery(params)
    )}`
  );

  return normalizePharmacyProductsResponse(
    getResponseData(response),
    params.pharmacyId
  );
}

//===================================================================

export async function getProductDetails(
  productId: Product['id']
): Promise<ProductDetailsResponse> {
  const response = await localApiRequest<
    ApiSuccessResponse<ProductDetailsResponse>
  >(PHARMACY_API_ROUTES.products.details(productId));

  return getResponseData(response);
}

//===================================================================

export async function getProductReviews(
  productId: Product['id']
): Promise<ProductReviewsResponse> {
  const response = await localApiRequest<
    ApiSuccessResponse<ProductReviewsResponse>
  >(PHARMACY_API_ROUTES.products.reviews(productId));

  return getResponseData(response);
}
