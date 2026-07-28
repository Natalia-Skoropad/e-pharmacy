import 'client-only';

import {
  appendQueryParams,
  getResponseData,
  type JsonResponseRequestOptions,
} from '@e-pharmacy/api-client/core';

import { localApiRequest } from '@e-pharmacy/next-api/browser';

import type {
  ApiSuccessResponse,
  FavoriteIdsResponse,
  FavoriteMutationResponse,
} from '@e-pharmacy/types/api';

import type {
  CatalogProductsQueryParams,
  ProductsResponse,
} from '@e-pharmacy/types/products';

import type {
  CreateReviewPayload,
  ReviewMutationResponse,
} from '@e-pharmacy/types/reviews';

import { createPublicProductsReader } from '@/lib/api/readers/public-products-reader';
import { clientApiRoutes as ROUTES } from '@/lib/api/routes';

//===================================================================

const publicProductsReader = createPublicProductsReader<
  JsonResponseRequestOptions
>(
  (path, options) => localApiRequest(path, options),
  ROUTES.products
);

export const getProductsFromClientApi = publicProductsReader.getProducts;
export const getProductFiltersFromClientApi = publicProductsReader.getFilters;
export const getProductDetailsFromClientApi = publicProductsReader.getDetails;
export const getProductReviewsFromClientApi = publicProductsReader.getReviews;

//===================================================================

export async function getFavoriteProductsFromClientApi(
  params: CatalogProductsQueryParams = {},
  options?: JsonResponseRequestOptions
): Promise<ProductsResponse> {
  const response = await localApiRequest<ApiSuccessResponse<ProductsResponse>>(
    appendQueryParams(ROUTES.products.favorites, params),
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
