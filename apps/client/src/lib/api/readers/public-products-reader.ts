import {
  appendQueryParams,
  getResponseData,
  type RequestOptions,
} from '@e-pharmacy/api-client/core';

import type { ApiSuccessResponse } from '@e-pharmacy/types/api';

import type {
  CatalogProductsQueryParams,
  ProductDetailsResponse,
  ProductFilterOptionsResponse,
  ProductsResponse,
} from '@e-pharmacy/types/products';

import type { ReviewsResponse } from '@e-pharmacy/types/reviews';

//===================================================================

export type ProductFiltersQueryParams = Pick<
  CatalogProductsQueryParams,
  'pharmacyId' | 'inStock'
>;

export type ApiReaderRequester<TOptions extends RequestOptions> = <TData>(
  path: string,
  options?: TOptions
) => Promise<TData>;

export type PublicProductReadRoutes = Readonly<{
  list: string;
  filters: string;
  details: (id: string) => string;
  reviews: (id: string) => string;
}>;

//===================================================================

export function createPublicProductsReader<TOptions extends RequestOptions>(
  request: ApiReaderRequester<TOptions>,
  routes: PublicProductReadRoutes
) {
  return {
    async getProducts(
      params: CatalogProductsQueryParams = {},
      options?: TOptions
    ): Promise<ProductsResponse> {
      return getResponseData(
        await request<ApiSuccessResponse<ProductsResponse>>(
          appendQueryParams(routes.list, params),
          options
        )
      );
    },

    async getFilters(
      params: ProductFiltersQueryParams = {},
      options?: TOptions
    ): Promise<ProductFilterOptionsResponse> {
      return getResponseData(
        await request<ApiSuccessResponse<ProductFilterOptionsResponse>>(
          appendQueryParams(routes.filters, params),
          options
        )
      );
    },

    async getDetails(
      id: string,
      options?: TOptions
    ): Promise<ProductDetailsResponse> {
      return getResponseData(
        await request<ApiSuccessResponse<ProductDetailsResponse>>(
          routes.details(id),
          options
        )
      );
    },

    async getReviews(id: string, options?: TOptions): Promise<ReviewsResponse> {
      return getResponseData(
        await request<ApiSuccessResponse<ReviewsResponse>>(
          routes.reviews(id),
          options
        )
      );
    },
  } as const;
}
