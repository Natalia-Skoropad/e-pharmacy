import { bffApiRequest } from '@/lib/api/bff-api';

import {
  buildQueryString,
  getResponseData,
  localApiRequest,
  type RequestOptions,
} from '@/lib/api';

import { apiRoutes as API_ROUTES } from '@e-pharmacy/api-client';
import { clientApiRoutes as CLIENT_API_ROUTES } from '@e-pharmacy/api-client';

import type {
  ApiSuccessResponse,
  CreateProductReviewPayload,
  CreateProductReviewResponse,
  ProductDetailsResponse,
  ProductFilterOptionsResponse,
  ProductReviewsResponse,
  ProductsQueryParams,
  ProductsResponse,
  ToggleFavoriteProductResponse,
} from '@/types';

//===================================================================

export async function getProducts(
  params: ProductsQueryParams = {},
  requestOptions?: RequestOptions
): Promise<ProductsResponse> {
  const queryString = buildQueryString(params);

  const response = await bffApiRequest<ApiSuccessResponse<ProductsResponse>>(
    `${API_ROUTES.products.list}${queryString}`,
    `${CLIENT_API_ROUTES.products.list}${queryString}`,
    requestOptions
  );

  return getResponseData(response);
}

//===================================================================

export async function getProductFilters(
  requestOptions?: RequestOptions
): Promise<ProductFilterOptionsResponse> {
  const response = await bffApiRequest<
    ApiSuccessResponse<ProductFilterOptionsResponse>
  >(
    API_ROUTES.products.filters,
    CLIENT_API_ROUTES.products.filters,
    requestOptions
  );

  return getResponseData(response);
}

//===================================================================

export async function getProductDetails(
  productId: string,
  requestOptions?: RequestOptions
): Promise<ProductDetailsResponse> {
  const response = await bffApiRequest<
    ApiSuccessResponse<ProductDetailsResponse>
  >(
    API_ROUTES.products.details(productId),
    CLIENT_API_ROUTES.products.details(productId),
    requestOptions
  );

  return getResponseData(response);
}

//===================================================================

export async function getProductReviews(
  productId: string,
  requestOptions?: RequestOptions
): Promise<ProductReviewsResponse> {
  const response = await bffApiRequest<
    ApiSuccessResponse<ProductReviewsResponse>
  >(
    API_ROUTES.products.reviews(productId),
    CLIENT_API_ROUTES.products.reviews(productId),
    requestOptions
  );

  return getResponseData(response);
}

//===================================================================

export async function createProductReview(
  productId: string,
  payload: CreateProductReviewPayload
): Promise<CreateProductReviewResponse> {
  const response = await localApiRequest<
    ApiSuccessResponse<CreateProductReviewResponse>
  >(CLIENT_API_ROUTES.products.reviews(productId), {
    method: 'POST',
    body: payload,
  });

  return getResponseData(response);
}

//===================================================================

export async function toggleFavoriteProduct(
  productId: string
): Promise<ToggleFavoriteProductResponse> {
  const response = await localApiRequest<
    ApiSuccessResponse<ToggleFavoriteProductResponse>
  >(CLIENT_API_ROUTES.products.favorite(productId), {
    method: 'PATCH',
  });

  return getResponseData(response);
}
