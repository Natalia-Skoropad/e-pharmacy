import { apiRequest, buildQueryString, getResponseData } from '@/lib/api';
import { API_ROUTES } from '@/lib/constants/api-routes';

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
  authToken?: string
): Promise<ProductsResponse> {
  const queryString = buildQueryString(params);

  const response = await apiRequest<ApiSuccessResponse<ProductsResponse>>(
    `${API_ROUTES.products.list}${queryString}`,
    authToken ? { authToken } : undefined
  );

  return getResponseData(response);
}

//===================================================================

export async function getProductFilters(): Promise<ProductFilterOptionsResponse> {
  const response = await apiRequest<
    ApiSuccessResponse<ProductFilterOptionsResponse>
  >(API_ROUTES.products.filters);

  return getResponseData(response);
}

//===================================================================

export async function getProductDetails(
  productId: string,
  authToken?: string
): Promise<ProductDetailsResponse> {
  const response = await apiRequest<ApiSuccessResponse<ProductDetailsResponse>>(
    API_ROUTES.products.details(productId),
    authToken ? { authToken } : undefined
  );

  return getResponseData(response);
}

//===================================================================

export async function getProductReviews(
  productId: string
): Promise<ProductReviewsResponse> {
  const response = await apiRequest<ApiSuccessResponse<ProductReviewsResponse>>(
    API_ROUTES.products.reviews(productId)
  );

  return getResponseData(response);
}

//===================================================================

export async function createProductReview(
  productId: string,
  payload: CreateProductReviewPayload,
  authToken: string
): Promise<CreateProductReviewResponse> {
  const response = await apiRequest<
    ApiSuccessResponse<CreateProductReviewResponse>
  >(API_ROUTES.products.reviews(productId), {
    method: 'POST',
    body: payload,
    authToken,
  });

  return getResponseData(response);
}

//===================================================================

export async function toggleFavoriteProduct(
  productId: string,
  authToken: string
): Promise<ToggleFavoriteProductResponse> {
  const response = await apiRequest<
    ApiSuccessResponse<ToggleFavoriteProductResponse>
  >(API_ROUTES.products.favorite(productId), {
    method: 'PATCH',
    authToken,
  });

  return getResponseData(response);
}
