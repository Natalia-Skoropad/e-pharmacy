import 'client-only';

import {
  buildQueryString,
  getResponseData,
  type RequestOptions,
} from '@e-pharmacy/api-client/core';

import type {
  AddProductToMyPharmacyResponse,
  ApiSuccessResponse,
  Product,
  ProductDetailsResponse,
  ProductReviewsResponse,
  ProductStockMovementsResponse,
  ProductsQueryParams,
  RemoveProductFromMyPharmacyResponse,
  ProductsResponse,
} from '@e-pharmacy/types';

import { pharmacyApiRoutes as PHARMACY_API_ROUTES } from '@/lib/api/routes/pharmacy-api-routes';

import {
  getOwnProductBackendQuery,
  normalizePharmacyProductsResponse,
  type PharmacyProductsQueryParams,
  type PharmacyProductsResponse,
} from '@/lib/products/products';

import { localApiRequest } from '@e-pharmacy/next-api/browser';

//===================================================================

export async function getProducts(
  params: ProductsQueryParams = {},
  options: RequestOptions = {}
): Promise<ProductsResponse> {
  const response = await localApiRequest<ApiSuccessResponse<ProductsResponse>>(
    `${PHARMACY_API_ROUTES.products.list}${buildQueryString(params)}`,
    options
  );

  return getResponseData(response);
}

//===================================================================

export async function getPharmacyProducts(
  params: PharmacyProductsQueryParams = {}
): Promise<PharmacyProductsResponse> {
  const response = await localApiRequest<ApiSuccessResponse<unknown>>(
    `${PHARMACY_API_ROUTES.products.list}${buildQueryString(
      getOwnProductBackendQuery(params)
    )}`
  );

  return normalizePharmacyProductsResponse(
    getResponseData(response),
    params.pharmacyId
  );
}

//===================================================================

export async function getProductDetails(
  productId: Product['id']
): Promise<ProductDetailsResponse> {
  const response = await localApiRequest<
    ApiSuccessResponse<ProductDetailsResponse>
  >(PHARMACY_API_ROUTES.products.details(productId));

  return getResponseData(response);
}

//===================================================================

export async function addProductToMyPharmacy(
  productId: Product['id']
): Promise<AddProductToMyPharmacyResponse> {
  const response = await localApiRequest<
    ApiSuccessResponse<AddProductToMyPharmacyResponse>
  >(PHARMACY_API_ROUTES.products.addToMyPharmacy(productId), {
    method: 'POST',
  });

  return getResponseData(response);
}

//===================================================================

export async function removeProductFromMyPharmacy(
  productId: Product['id']
): Promise<RemoveProductFromMyPharmacyResponse> {
  const response = await localApiRequest<
    ApiSuccessResponse<RemoveProductFromMyPharmacyResponse>
  >(PHARMACY_API_ROUTES.products.removeFromMyPharmacy(productId), {
    method: 'DELETE',
  });

  return getResponseData(response);
}

//===================================================================

export async function getProductStockMovements(
  productId: Product['id']
): Promise<ProductStockMovementsResponse> {
  const response = await localApiRequest<
    ApiSuccessResponse<ProductStockMovementsResponse>
  >(PHARMACY_API_ROUTES.products.stockMovements(productId));

  return getResponseData(response);
}

//===================================================================

export async function getProductReviews(
  productId: Product['id']
): Promise<ProductReviewsResponse> {
  const response = await localApiRequest<
    ApiSuccessResponse<ProductReviewsResponse>
  >(PHARMACY_API_ROUTES.products.reviews(productId));

  return getResponseData(response);
}
