import 'server-only';

import {
  buildQueryString,
  getResponseData,
  type RequestOptions,
} from '@e-pharmacy/api-client/core';

import { apiRoutes as ROUTES } from '@e-pharmacy/api-client/contracts';
import { backendApiRequest } from '@e-pharmacy/next-api/server';

import type { ApiSuccessResponse } from '@e-pharmacy/types/api';

import type {
  ProductDetailsResponse,
  ProductFilterOptionsResponse,
  CatalogProductsQueryParams,
  ProductsResponse,
} from '@e-pharmacy/types/products';

import type { ReviewsResponse } from '@e-pharmacy/types/reviews';

//===================================================================

type ProductFiltersQueryParams = Pick<
  CatalogProductsQueryParams,
  'pharmacyId' | 'inStock'
>;

//===================================================================

function isRequestOptions(value: unknown): value is RequestOptions {
  if (!value || typeof value !== 'object') return false;

  return [
    'method',
    'body',
    'headers',
    'cache',
    'next',
    'credentials',
    'signal',
    'baseUrl',
    'timeoutMs',
    'retry',
  ].some((key) => key in value);
}

//===================================================================

export async function getProductsFromBackend(
  params: CatalogProductsQueryParams = {},
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
  paramsOrOptions: ProductFiltersQueryParams | RequestOptions = {},
  options?: RequestOptions
): Promise<ProductFilterOptionsResponse> {
  const params = isRequestOptions(paramsOrOptions) ? {} : paramsOrOptions;
  const requestOptions = isRequestOptions(paramsOrOptions)
    ? paramsOrOptions
    : options;

  return getResponseData(
    await backendApiRequest<ApiSuccessResponse<ProductFilterOptionsResponse>>(
      `${ROUTES.products.filters}${buildQueryString(params)}`,
      requestOptions
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
): Promise<ReviewsResponse> {
  return getResponseData(
    await backendApiRequest<ApiSuccessResponse<ReviewsResponse>>(
      ROUTES.products.reviews(id),
      options
    )
  );
}
