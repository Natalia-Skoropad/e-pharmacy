import { apiRequest, buildQueryString, getResponseData } from '@/lib/api';
import { API_ROUTES } from '@/lib/constants/api-routes';

import type {
  ApiSuccessResponse,
  ProductDetailsResponse,
  ProductReviewsResponse,
  ProductsQueryParams,
  ProductsResponse,
} from '@/types';

//===================================================================

export async function getProducts(
  params: ProductsQueryParams = {}
): Promise<ProductsResponse> {
  const queryString = buildQueryString(params);

  const response = await apiRequest<ApiSuccessResponse<ProductsResponse>>(
    `${API_ROUTES.products.list}${queryString}`
  );

  return getResponseData(response);
}

//===================================================================

export async function getProductDetails(
  productId: string
): Promise<ProductDetailsResponse> {
  const response = await apiRequest<ApiSuccessResponse<ProductDetailsResponse>>(
    API_ROUTES.products.details(productId)
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
