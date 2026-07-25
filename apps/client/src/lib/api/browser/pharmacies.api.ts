import 'client-only';

import {
  buildQueryString,
  getResponseData,
  type JsonResponseRequestOptions,
} from '@e-pharmacy/api-client/core';

import { localApiRequest } from '@e-pharmacy/next-api/browser';

import type {
  ApiSuccessResponse,
  FavoriteMutationResponse,
  FavoriteIdsResponse,
} from '@e-pharmacy/types/api';

import type {
  PharmacyCheckoutDetailsResponse,
  PharmacyDetailsResponse,
  PharmacyFilterOptionsResponse,
  PharmaciesQueryParams,
  PharmaciesResponse,
  PharmacyOptionsResponse,
} from '@e-pharmacy/types/pharmacies';

import type {
  CreateReviewPayload,
  ReviewMutationResponse,
  ReviewsResponse,
} from '@e-pharmacy/types/reviews';

import { clientApiRoutes as ROUTES } from '@/lib/api/routes';

//===================================================================

export async function getPharmaciesFromClientApi(
  params: PharmaciesQueryParams = {},
  options?: JsonResponseRequestOptions
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
  options?: JsonResponseRequestOptions
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
  options?: JsonResponseRequestOptions
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
  options?: JsonResponseRequestOptions
): Promise<FavoriteIdsResponse> {
  const response = await localApiRequest<
    ApiSuccessResponse<FavoriteIdsResponse>
  >(ROUTES.pharmacies.favoriteIds, options);
  return getResponseData(response);
}

//===================================================================

export async function getPharmacyFiltersFromClientApi(
  options?: JsonResponseRequestOptions
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
  options?: JsonResponseRequestOptions
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
  options?: JsonResponseRequestOptions
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
  options?: JsonResponseRequestOptions
): Promise<ReviewsResponse> {
  return getResponseData(
    await localApiRequest<ApiSuccessResponse<ReviewsResponse>>(
      ROUTES.pharmacies.reviews(id),
      options
    )
  );
}

//===================================================================

export async function createPharmacyReview(
  id: string,
  payload: CreateReviewPayload
): Promise<ReviewMutationResponse> {
  return getResponseData(
    await localApiRequest<ApiSuccessResponse<ReviewMutationResponse>>(
      ROUTES.pharmacies.reviews(id),
      { method: 'POST', body: payload }
    )
  );
}

//===================================================================

export async function addFavoritePharmacy(
  id: string
): Promise<FavoriteMutationResponse> {
  return getResponseData(
    await localApiRequest<ApiSuccessResponse<FavoriteMutationResponse>>(
      ROUTES.pharmacies.favorite(id),
      { method: 'PUT' }
    )
  );
}

//===================================================================

export async function removeFavoritePharmacy(
  id: string
): Promise<FavoriteMutationResponse> {
  return getResponseData(
    await localApiRequest<ApiSuccessResponse<FavoriteMutationResponse>>(
      ROUTES.pharmacies.favorite(id),
      { method: 'DELETE' }
    )
  );
}
