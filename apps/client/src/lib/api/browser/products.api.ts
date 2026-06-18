import {
  buildQueryString,
  getResponseData,
  type RequestOptions,
} from '@e-pharmacy/api-client/core';

import { localApiRequest } from './local-api-request';
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
} from '@e-pharmacy/types';

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

export async function getProductFiltersFromClientApi(
  options?: RequestOptions
): Promise<ProductFilterOptionsResponse> {
  return getResponseData(
    await localApiRequest<ApiSuccessResponse<ProductFilterOptionsResponse>>(
      ROUTES.products.filters,
      options
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
