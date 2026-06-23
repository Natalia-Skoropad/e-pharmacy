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

type ProductFiltersQueryParams = Pick<
  ProductsQueryParams,
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
): Promise<ProductReviewsResponse> {
  return getResponseData(
    await backendApiRequest<ApiSuccessResponse<ProductReviewsResponse>>(
      ROUTES.products.reviews(id),
      options
    )
  );
}
