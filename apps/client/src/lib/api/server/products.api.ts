import 'server-only';

import {
  apiRequest,
  buildQueryString,
  getResponseData,
  type RequestOptions,
} from '@e-pharmacy/api-client/core';

import { apiRoutes as ROUTES } from '@e-pharmacy/api-client/contracts';

import type {
  ApiSuccessResponse,
  ProductDetailsResponse,
  ProductFilterOptionsResponse,
  ProductReviewsResponse,
  ProductsQueryParams,
  ProductsResponse,
} from '@e-pharmacy/types';

//===================================================================

export async function getProductsFromBackend(
  params: ProductsQueryParams = {},
  options?: RequestOptions
): Promise<ProductsResponse> {
  return getResponseData(
    await apiRequest<ApiSuccessResponse<ProductsResponse>>(
      `${ROUTES.products.list}${buildQueryString(params)}`,
      options
    )
  );
}

//===================================================================

export async function getProductFiltersFromBackend(
  options?: RequestOptions
): Promise<ProductFilterOptionsResponse> {
  return getResponseData(
    await apiRequest<ApiSuccessResponse<ProductFilterOptionsResponse>>(
      ROUTES.products.filters,
      options
    )
  );
}

//===================================================================

export async function getProductDetailsFromBackend(
  id: string,
  options?: RequestOptions
): Promise<ProductDetailsResponse> {
  return getResponseData(
    await apiRequest<ApiSuccessResponse<ProductDetailsResponse>>(
      ROUTES.products.details(id),
      options
    )
  );
}

//===================================================================

export async function getProductReviewsFromBackend(
  id: string,
  options?: RequestOptions
): Promise<ProductReviewsResponse> {
  return getResponseData(
    await apiRequest<ApiSuccessResponse<ProductReviewsResponse>>(
      ROUTES.products.reviews(id),
      options
    )
  );
}
