import {
  appendQueryParams,
  getResponseData,
  type RequestOptions,
} from '@e-pharmacy/api-client/core';

import type { ApiSuccessResponse } from '@e-pharmacy/types/api';

import type {
  PharmaciesQueryParams,
  PharmaciesResponse,
  PharmacyDetailsResponse,
  PharmacyFilterOptionsResponse,
  PharmacyOptionsResponse,
} from '@e-pharmacy/types/pharmacies';

import type { ReviewsResponse } from '@e-pharmacy/types/reviews';

import type { ApiReaderRequester } from './public-products-reader';

//===================================================================

export type PublicPharmacyReadRoutes = Readonly<{
  list: string;
  options: string;
  filters: string;
  details: (id: string) => string;
  reviews: (id: string) => string;
}>;

//===================================================================

export function createPublicPharmaciesReader<TOptions extends RequestOptions>(
  request: ApiReaderRequester<TOptions>,
  routes: PublicPharmacyReadRoutes
) {
  return {
    async getPharmacies(
      params: PharmaciesQueryParams = {},
      options?: TOptions
    ): Promise<PharmaciesResponse> {
      return getResponseData(
        await request<ApiSuccessResponse<PharmaciesResponse>>(
          appendQueryParams(routes.list, params),
          options
        )
      );
    },

    async getOptions(options?: TOptions): Promise<PharmacyOptionsResponse> {
      return getResponseData(
        await request<ApiSuccessResponse<PharmacyOptionsResponse>>(
          routes.options,
          options
        )
      );
    },

    async getFilters(
      options?: TOptions
    ): Promise<PharmacyFilterOptionsResponse> {
      return getResponseData(
        await request<ApiSuccessResponse<PharmacyFilterOptionsResponse>>(
          routes.filters,
          options
        )
      );
    },

    async getDetails(
      id: string,
      options?: TOptions
    ): Promise<PharmacyDetailsResponse> {
      return getResponseData(
        await request<ApiSuccessResponse<PharmacyDetailsResponse>>(
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
