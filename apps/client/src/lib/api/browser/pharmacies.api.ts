import {
  buildQueryString,
  getResponseData,
  type RequestOptions,
} from '@e-pharmacy/api-client/core';

import { localApiRequest } from './local-api-request';
import { clientApiRoutes as ROUTES } from '@/lib/api/routes';

import type {
  ApiSuccessResponse,
  CreatePharmacyReviewPayload,
  CreatePharmacyReviewResponse,
  PharmacyCheckoutDetailsResponse,
  PharmacyDetailsResponse,
  PharmacyFilterOptionsResponse,
  PharmacyReviewsResponse,
  PharmaciesQueryParams,
  PharmaciesResponse,
  FavoritePharmacyResponse,
  FavoritePharmacyIdsResponse,
  PharmacyOptionsResponse,
} from '@e-pharmacy/types';

//===================================================================

export async function getPharmaciesFromClientApi(
  params: PharmaciesQueryParams = {},
  options?: RequestOptions
): Promise<PharmaciesResponse> {
  return getResponseData(
    await localApiRequest<ApiSuccessResponse<PharmaciesResponse>>(
      `${ROUTES.pharmacies.list}${buildQueryString(params)}`,
      options
    )
  );
}

//===================================================================

export async function getFavoritePharmaciesFromClientApi(
  params: PharmaciesQueryParams = {},
  options?: RequestOptions
): Promise<PharmaciesResponse> {
  return getResponseData(
    await localApiRequest<ApiSuccessResponse<PharmaciesResponse>>(
      `${ROUTES.pharmacies.favorites}${buildQueryString(params)}`,
      options
    )
  );
}

//===================================================================

export async function getPharmacyOptionsFromClientApi(
  options?: RequestOptions
): Promise<PharmacyOptionsResponse> {
  return getResponseData(
    await localApiRequest<ApiSuccessResponse<PharmacyOptionsResponse>>(
      ROUTES.pharmacies.options,
      options
    )
  );
}


//===================================================================

export async function getFavoritePharmacyIdsFromClientApi(
  options?: RequestOptions
): Promise<FavoritePharmacyIdsResponse> {
  const response = await localApiRequest<
    ApiSuccessResponse<FavoritePharmacyIdsResponse>
  >(ROUTES.pharmacies.favoriteIds, options);
  return getResponseData(response);
}

//===================================================================

export async function getPharmacyFiltersFromClientApi(
  options?: RequestOptions
): Promise<PharmacyFilterOptionsResponse> {
  return getResponseData(
    await localApiRequest<ApiSuccessResponse<PharmacyFilterOptionsResponse>>(
      ROUTES.pharmacies.filters,
      options
    )
  );
}

//===================================================================

export async function getPharmacyDetailsFromClientApi(
  id: string,
  options?: RequestOptions
): Promise<PharmacyDetailsResponse> {
  return getResponseData(
    await localApiRequest<ApiSuccessResponse<PharmacyDetailsResponse>>(
      ROUTES.pharmacies.details(id),
      options
    )
  );
}

//===================================================================

export async function getPharmacyCheckoutDetails(
  id: string,
  options?: RequestOptions
): Promise<PharmacyCheckoutDetailsResponse> {
  return getResponseData(
    await localApiRequest<ApiSuccessResponse<PharmacyCheckoutDetailsResponse>>(
      ROUTES.pharmacies.checkoutDetails(id),
      options
    )
  );
}

//===================================================================

export async function getPharmacyReviewsFromClientApi(
  id: string,
  options?: RequestOptions
): Promise<PharmacyReviewsResponse> {
  return getResponseData(
    await localApiRequest<ApiSuccessResponse<PharmacyReviewsResponse>>(
      ROUTES.pharmacies.reviews(id),
      options
    )
  );
}

//===================================================================

export async function createPharmacyReview(
  id: string,
  payload: CreatePharmacyReviewPayload
): Promise<CreatePharmacyReviewResponse> {
  return getResponseData(
    await localApiRequest<ApiSuccessResponse<CreatePharmacyReviewResponse>>(
      ROUTES.pharmacies.reviews(id),
      { method: 'POST', body: payload }
    )
  );
}

//===================================================================

export async function addFavoritePharmacy(
  id: string
): Promise<FavoritePharmacyResponse> {
  return getResponseData(
    await localApiRequest<ApiSuccessResponse<FavoritePharmacyResponse>>(
      ROUTES.pharmacies.favorite(id),
      { method: 'PUT' }
    )
  );
}

//===================================================================

export async function removeFavoritePharmacy(
  id: string
): Promise<FavoritePharmacyResponse> {
  return getResponseData(
    await localApiRequest<ApiSuccessResponse<FavoritePharmacyResponse>>(
      ROUTES.pharmacies.favorite(id),
      { method: 'DELETE' }
    )
  );
}
