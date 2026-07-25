import 'client-only';

import {
  buildQueryString,
  getResponseData,
  type JsonResponseRequestOptions,
} from '@e-pharmacy/api-client/core';

import { localApiRequest } from '@e-pharmacy/next-api/browser';

import type {
  ApiSuccessResponse,
  FavoriteMutationResponse,
  FavoriteIdsResponse,
} from '@e-pharmacy/types/api';

import type {
  ProductDetailsResponse,
  ProductFilterOptionsResponse,
  CatalogProductsQueryParams,
  ProductsResponse,
} from '@e-pharmacy/types/products';

import type {
  CreateReviewPayload,
  ReviewMutationResponse,
  ReviewsResponse,
} from '@e-pharmacy/types/reviews';

import { clientApiRoutes as ROUTES } from '@/lib/api/routes';

//===================================================================

type ProductFiltersQueryParams = Pick<
  CatalogProductsQueryParams,
  'pharmacyId' | 'inStock'
>;

//===================================================================

function isRequestOptions(
  value: unknown
): value is JsonResponseRequestOptions {
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
    'responseType',
  ].some((key) => key in value);
}

//===================================================================

export async function getProductsFromClientApi(
  params: CatalogProductsQueryParams = {},
  options?: JsonResponseRequestOptions
): Promise<ProductsResponse> {
  const response = await localApiRequest<ApiSuccessResponse<ProductsResponse>>(
    `${ROUTES.products.list}${buildQueryString(params)}`,
    options
  );
  return getResponseData(response);
}

//===================================================================

export async function getFavoriteProductsFromClientApi(
  params: CatalogProductsQueryParams = {},
  options?: JsonResponseRequestOptions
): Promise<ProductsResponse> {
  const response = await localApiRequest<ApiSuccessResponse<ProductsResponse>>(
    `${ROUTES.products.favorites}${buildQueryString(params)}`,
    options
  );
  return getResponseData(response);
}

//===================================================================

export async function getFavoriteProductIdsFromClientApi(
  options?: JsonResponseRequestOptions
): Promise<FavoriteIdsResponse> {
  const response = await localApiRequest<
    ApiSuccessResponse<FavoriteIdsResponse>
  >(ROUTES.products.favoriteIds, options);
  return getResponseData(response);
}

//===================================================================

export async function getProductFiltersFromClientApi(
  paramsOrOptions: ProductFiltersQueryParams | JsonResponseRequestOptions = {},
  options?: JsonResponseRequestOptions
): Promise<ProductFilterOptionsResponse> {
  const params = isRequestOptions(paramsOrOptions)
    ? {}
    : paramsOrOptions;
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
  options?: JsonResponseRequestOptions
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
  options?: JsonResponseRequestOptions
): Promise<ReviewsResponse> {
  return getResponseData(
    await localApiRequest<ApiSuccessResponse<ReviewsResponse>>(
      ROUTES.products.reviews(id),
      options
    )
  );
}

//===================================================================

export async function createProductReview(
  id: string,
  payload: CreateReviewPayload
): Promise<ReviewMutationResponse> {
  return getResponseData(
    await localApiRequest<ApiSuccessResponse<ReviewMutationResponse>>(
      ROUTES.products.reviews(id),
      { method: 'POST', body: payload }
    )
  );
}

//===================================================================

export async function addFavoriteProduct(
  id: string
): Promise<FavoriteMutationResponse> {
  return getResponseData(
    await localApiRequest<ApiSuccessResponse<FavoriteMutationResponse>>(
      ROUTES.products.favorite(id),
      { method: 'PUT' }
    )
  );
}

//===================================================================

export async function removeFavoriteProduct(
  id: string
): Promise<FavoriteMutationResponse> {
  return getResponseData(
    await localApiRequest<ApiSuccessResponse<FavoriteMutationResponse>>(
      ROUTES.products.favorite(id),
      { method: 'DELETE' }
    )
  );
}
