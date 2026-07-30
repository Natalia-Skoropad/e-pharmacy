import {
  appendQueryParams,
  type RequestOptions,
} from '@e-pharmacy/api-client/transport';

import {
  parseApiResponseData,
  parseProductDetailsResponse,
  parseProductFilterOptionsResponse,
  parseProductsResponse,
  parseReviewsResponse,
} from '@e-pharmacy/api-client/response';

import type {
  CatalogProductsQueryParams,
  ProductDetailsResponse,
  ProductFilterOptionsResponse,
  ProductsResponse,
} from '@e-pharmacy/types/products';

import type { ReviewsResponse } from '@e-pharmacy/types/reviews';

import type { ApiReaderRequester } from './types';

//===================================================================

type ProductFiltersQueryParams = Pick<
  CatalogProductsQueryParams,
  'pharmacyId' | 'inStock'
>;

//===================================================================

type PublicProductReadRoutes = Readonly<{
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
      const path = appendQueryParams(routes.list, params);

      return parseApiResponseData(
        await request(path, options),
        parseProductsResponse,
        { url: path, method: 'GET' }
      );
    },

    async getFilters(
      params: ProductFiltersQueryParams = {},
      options?: TOptions
    ): Promise<ProductFilterOptionsResponse> {
      const path = appendQueryParams(routes.filters, params);

      return parseApiResponseData(
        await request(path, options),
        parseProductFilterOptionsResponse,
        { url: path, method: 'GET' }
      );
    },

    async getDetails(
      id: string,
      options?: TOptions
    ): Promise<ProductDetailsResponse> {
      const path = routes.details(id);

      return parseApiResponseData(
        await request(path, options),
        parseProductDetailsResponse,
        { url: path, method: 'GET' }
      );
    },

    async getReviews(id: string, options?: TOptions): Promise<ReviewsResponse> {
      const path = routes.reviews(id);

      return parseApiResponseData(
        await request(path, options),
        parseReviewsResponse,
        { url: path, method: 'GET' }
      );
    },
  } as const;
}
