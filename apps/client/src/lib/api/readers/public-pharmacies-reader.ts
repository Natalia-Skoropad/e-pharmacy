import {
  appendQueryParams,
  type RequestOptions,
} from '@e-pharmacy/api-client/transport';

import {
  parseApiResponseData,
  parsePharmaciesResponse,
  parsePharmacyDetailsResponse,
  parsePharmacyFilterOptionsResponse,
  parsePharmacyOptionsResponse,
  parseReviewsResponse,
} from '@e-pharmacy/api-client/response';

import type {
  PharmaciesQueryParams,
  PharmaciesResponse,
  PharmacyDetailsResponse,
  PharmacyFilterOptionsResponse,
  PharmacyOptionsResponse,
} from '@e-pharmacy/types/pharmacies';

import type { ReviewsResponse } from '@e-pharmacy/types/reviews';

import type { ApiReaderRequester } from './types';

//===================================================================

type PublicPharmacyReadRoutes = Readonly<{
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
      const path = appendQueryParams(routes.list, params);

      return parseApiResponseData(
        await request(path, options),
        parsePharmaciesResponse,
        { url: path, method: 'GET' }
      );
    },

    async getOptions(options?: TOptions): Promise<PharmacyOptionsResponse> {
      return parseApiResponseData(
        await request(routes.options, options),
        parsePharmacyOptionsResponse,
        { url: routes.options, method: 'GET' }
      );
    },

    async getFilters(
      options?: TOptions
    ): Promise<PharmacyFilterOptionsResponse> {
      return parseApiResponseData(
        await request(routes.filters, options),
        parsePharmacyFilterOptionsResponse,
        { url: routes.filters, method: 'GET' }
      );
    },

    async getDetails(
      id: string,
      options?: TOptions
    ): Promise<PharmacyDetailsResponse> {
      const path = routes.details(id);

      return parseApiResponseData(
        await request(path, options),
        parsePharmacyDetailsResponse,
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
