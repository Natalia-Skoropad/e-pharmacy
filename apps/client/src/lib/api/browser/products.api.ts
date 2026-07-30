import 'client-only';

import { appendQueryParams } from '@e-pharmacy/api-client/transport';

import {
  parseApiResponseData,
  parseFavoriteIdsResponse,
  parseFavoriteMutationResponse,
  parseProductsResponse,
  parseReviewMutationResponse,
} from '@e-pharmacy/api-client/response';

import { localApiRequest } from '@e-pharmacy/next-api/browser';

import type {
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
import { clientApiRoutes as ROUTES } from '@/lib/api/routes/client-api-routes';

import type {
  MutationRequestOptions,
  ReadRequestOptions,
} from '@/lib/api/request-options';

//===================================================================

const publicProductsReader = createPublicProductsReader<ReadRequestOptions>(
  (path, options) => localApiRequest(path, options),
  ROUTES.products
);

//===================================================================

export const getProducts = publicProductsReader.getProducts;
export const getProductFilters = publicProductsReader.getFilters;
export const getProductDetails = publicProductsReader.getDetails;
export const getProductReviews = publicProductsReader.getReviews;

//===================================================================

export async function getFavoriteProducts(
  params: CatalogProductsQueryParams = {},
  options?: ReadRequestOptions
): Promise<ProductsResponse> {
  const path = appendQueryParams(ROUTES.products.favorites, params);

  return parseApiResponseData(
    await localApiRequest(path, options),
    parseProductsResponse,
    { url: path, method: 'GET' }
  );
}

//===================================================================

export async function getFavoriteProductIds(
  options?: ReadRequestOptions
): Promise<FavoriteIdsResponse> {
  const path = ROUTES.products.favoriteIds;

  return parseApiResponseData(
    await localApiRequest(path, options),
    parseFavoriteIdsResponse,
    { url: path, method: 'GET' }
  );
}

//===================================================================

export async function createProductReview(
  id: string,
  payload: CreateReviewPayload,
  options?: MutationRequestOptions
): Promise<ReviewMutationResponse> {
  const path = ROUTES.products.reviews(id);

  return parseApiResponseData(
    await localApiRequest(path, { ...options, method: 'POST', body: payload }),
    parseReviewMutationResponse,
    { url: path, method: 'POST' }
  );
}

//===================================================================

export async function addFavoriteProduct(
  id: string,
  options?: MutationRequestOptions
): Promise<FavoriteMutationResponse> {
  const path = ROUTES.products.favorite(id);

  return parseApiResponseData(
    await localApiRequest(path, { ...options, method: 'PUT' }),
    parseFavoriteMutationResponse,
    { url: path, method: 'PUT' }
  );
}

//===================================================================

export async function removeFavoriteProduct(
  id: string,
  options?: MutationRequestOptions
): Promise<FavoriteMutationResponse> {
  const path = ROUTES.products.favorite(id);

  return parseApiResponseData(
    await localApiRequest(path, { ...options, method: 'DELETE' }),
    parseFavoriteMutationResponse,
    { url: path, method: 'DELETE' }
  );
}
