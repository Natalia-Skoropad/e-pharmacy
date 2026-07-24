import 'server-only';

import {
  buildQueryString,
  getResponseData,
  type RequestOptions,
} from '@e-pharmacy/api-client/core';

import { apiRoutes as ROUTES } from '@e-pharmacy/api-client/contracts';
import { publicBackendApiRequest } from '@e-pharmacy/next-api/server';
import type { ApiSuccessResponse } from '@e-pharmacy/types/api';

import type {
  PharmacyDetailsResponse,
  PharmacyFilterOptionsResponse,
  PharmaciesQueryParams,
  PharmaciesResponse,
  PharmacyOptionsResponse,
} from '@e-pharmacy/types/pharmacies';

import type { ReviewsResponse } from '@e-pharmacy/types/reviews';

//===================================================================

export async function getPharmaciesFromBackend(
  params: PharmaciesQueryParams = {},
  options?: RequestOptions
): Promise<PharmaciesResponse> {
  return getResponseData(
    await publicBackendApiRequest<ApiSuccessResponse<PharmaciesResponse>>(
      `${ROUTES.pharmacies.list}${buildQueryString(params)}`,
      options
    )
  );
}

//===================================================================

export async function getPharmacyOptionsFromBackend(
  options?: RequestOptions
): Promise<PharmacyOptionsResponse> {
  return getResponseData(
    await publicBackendApiRequest<ApiSuccessResponse<PharmacyOptionsResponse>>(
      ROUTES.pharmacies.options,
      options
    )
  );
}

//===================================================================

export async function getPharmacyFiltersFromBackend(
  options?: RequestOptions
): Promise<PharmacyFilterOptionsResponse> {
  return getResponseData(
    await publicBackendApiRequest<
      ApiSuccessResponse<PharmacyFilterOptionsResponse>
    >(ROUTES.pharmacies.filters, options)
  );
}

//===================================================================

export async function getPharmacyDetailsFromBackend(
  id: string,
  options?: RequestOptions
): Promise<PharmacyDetailsResponse> {
  return getResponseData(
    await publicBackendApiRequest<ApiSuccessResponse<PharmacyDetailsResponse>>(
      ROUTES.pharmacies.details(id),
      options
    )
  );
}

//===================================================================

export async function getPharmacyReviewsFromBackend(
  id: string,
  options?: RequestOptions
): Promise<ReviewsResponse> {
  return getResponseData(
    await publicBackendApiRequest<ApiSuccessResponse<ReviewsResponse>>(
      ROUTES.pharmacies.reviews(id),
      options
    )
  );
}
