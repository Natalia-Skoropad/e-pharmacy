import 'client-only';

import {
  buildQueryString,
  getResponseData,
  type RequestOptions,
} from '@e-pharmacy/api-client/core';

import { localApiRequest } from '@e-pharmacy/next-api/browser';
import { clientApiRoutes as ROUTES } from '@/lib/api/routes';

import type {
  ApiSuccessResponse,
  CreateProductReviewPayload,
  CreateProductReviewResponse,
  ProductDetailsResponse,
  ProductFilterOptionsResponse,
  ProductReviewsResponse,
  ProductsQueryParams,
  ProductsResponse,
  FavoriteProductResponse,
  FavoriteProductIdsResponse,
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

export async function getProductsFromClientApi(
  params: ProductsQueryParams = {},
  options?: RequestOptions
): Promise<ProductsResponse> {
  const response = await localApiRequest<ApiSuccessResponse<ProductsResponse>>(
    `${ROUTES.products.list}${buildQueryString(params)}`,
    options
  );
  return getResponseData(response);
}

//===================================================================

export async function getFavoriteProductsFromClientApi(
  params: ProductsQueryParams = {},
  options?: RequestOptions
): Promise<ProductsResponse> {
  const response = await localApiRequest<ApiSuccessResponse<ProductsResponse>>(
    `${ROUTES.products.favorites}${buildQueryString(params)}`,
    options
  );
  return getResponseData(response);
}

//===================================================================

export async function getFavoriteProductIdsFromClientApi(
  options?: RequestOptions
): Promise<FavoriteProductIdsResponse> {
  const response = await localApiRequest<
    ApiSuccessResponse<FavoriteProductIdsResponse>
  >(ROUTES.products.favoriteIds, options);
  return getResponseData(response);
}

//===================================================================

export async function getProductFiltersFromClientApi(
  paramsOrOptions: ProductFiltersQueryParams | RequestOptions = {},
  options?: RequestOptions
): Promise<ProductFilterOptionsResponse> {
  const params = isRequestOptions(paramsOrOptions) ? {} : paramsOrOptions;
  const requestOptions = isRequestOptions(paramsOrOptions)
    ? paramsOrOptions
    : options;

  return getResponseData(
    await localApiRequest<ApiSuccessResponse<ProductFilterOptionsResponse>>(
      `${ROUTES.products.filters}${buildQueryString(params)}`,
      requestOptions
    )
  );
}

//===================================================================

export async function getProductDetailsFromClientApi(
  id: string,
  options?: RequestOptions
): Promise<ProductDetailsResponse> {
  return getResponseData(
    await localApiRequest<ApiSuccessResponse<ProductDetailsResponse>>(
      ROUTES.products.details(id),
      options
    )
  );
}

//===================================================================

export async function getProductReviewsFromClientApi(
  id: string,
  options?: RequestOptions
): Promise<ProductReviewsResponse> {
  return getResponseData(
    await localApiRequest<ApiSuccessResponse<ProductReviewsResponse>>(
      ROUTES.products.reviews(id),
      options
    )
  );
}

//===================================================================

export async function createProductReview(
  id: string,
  payload: CreateProductReviewPayload
): Promise<CreateProductReviewResponse> {
  return getResponseData(
    await localApiRequest<ApiSuccessResponse<CreateProductReviewResponse>>(
      ROUTES.products.reviews(id),
      { method: 'POST', body: payload }
    )
  );
}

//===================================================================

export async function addFavoriteProduct(
  id: string
): Promise<FavoriteProductResponse> {
  return getResponseData(
    await localApiRequest<ApiSuccessResponse<FavoriteProductResponse>>(
      ROUTES.products.favorite(id),
      { method: 'PUT' }
    )
  );
}

//===================================================================

export async function removeFavoriteProduct(
  id: string
): Promise<FavoriteProductResponse> {
  return getResponseData(
    await localApiRequest<ApiSuccessResponse<FavoriteProductResponse>>(
      ROUTES.products.favorite(id),
      { method: 'DELETE' }
    )
  );
}
