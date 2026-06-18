import 'server-only';

import {
  buildQueryString,
  getResponseData,
  type RequestOptions,
} from '@e-pharmacy/api-client/core';

import { apiRoutes as ROUTES } from '@e-pharmacy/api-client/contracts';
import { backendApiRequest } from './backend-api-request';

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
    await backendApiRequest<ApiSuccessResponse<ProductsResponse>>(
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
    await backendApiRequest<ApiSuccessResponse<ProductFilterOptionsResponse>>(
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
    await backendApiRequest<ApiSuccessResponse<ProductDetailsResponse>>(
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
    await backendApiRequest<ApiSuccessResponse<ProductReviewsResponse>>(
      ROUTES.products.reviews(id),
      options
    )
  );
}
