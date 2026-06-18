import 'server-only';

import {
  apiRequest,
  buildQueryString,
  getResponseData,
  type RequestOptions,
} from '@e-pharmacy/api-client/core';

import { apiRoutes as ROUTES } from '@e-pharmacy/api-client/contracts';

import type {
  ApiSuccessResponse,
  PharmacyDetailsResponse,
  PharmacyFilterOptionsResponse,
  PharmacyReviewsResponse,
  PharmaciesQueryParams,
  PharmaciesResponse,
  PharmacyOptionsResponse,
} from '@e-pharmacy/types';

//===================================================================

export async function getPharmaciesFromBackend(
  params: PharmaciesQueryParams = {},
  options?: RequestOptions
): Promise<PharmaciesResponse> {
  return getResponseData(
    await apiRequest<ApiSuccessResponse<PharmaciesResponse>>(
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
    await apiRequest<ApiSuccessResponse<PharmacyOptionsResponse>>(
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
    await apiRequest<ApiSuccessResponse<PharmacyFilterOptionsResponse>>(
      ROUTES.pharmacies.filters,
      options
    )
  );
}

//===================================================================

export async function getPharmacyDetailsFromBackend(
  id: string,
  options?: RequestOptions
): Promise<PharmacyDetailsResponse> {
  return getResponseData(
    await apiRequest<ApiSuccessResponse<PharmacyDetailsResponse>>(
      ROUTES.pharmacies.details(id),
      options
    )
  );
}

//===================================================================

export async function getPharmacyReviewsFromBackend(
  id: string,
  options?: RequestOptions
): Promise<PharmacyReviewsResponse> {
  return getResponseData(
    await apiRequest<ApiSuccessResponse<PharmacyReviewsResponse>>(
      ROUTES.pharmacies.reviews(id),
      options
    )
  );
}
