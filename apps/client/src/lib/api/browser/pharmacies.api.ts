import 'client-only';

import {
  appendQueryParams,
  getResponseData,
  type JsonResponseRequestOptions,
} from '@e-pharmacy/api-client/core';

import { localApiRequest } from '@e-pharmacy/next-api/browser';

import type {
  ApiSuccessResponse,
  FavoriteIdsResponse,
  FavoriteMutationResponse,
} from '@e-pharmacy/types/api';

import type {
  PharmaciesQueryParams,
  PharmaciesResponse,
  PharmacyCheckoutDetailsResponse,
} from '@e-pharmacy/types/pharmacies';

import type {
  CreateReviewPayload,
  ReviewMutationResponse,
} from '@e-pharmacy/types/reviews';

import { createPublicPharmaciesReader } from '@/lib/api/readers/public-pharmacies-reader';
import { clientApiRoutes as ROUTES } from '@/lib/api/routes';

//===================================================================

const publicPharmaciesReader = createPublicPharmaciesReader<
  JsonResponseRequestOptions
>(
  (path, options) => localApiRequest(path, options),
  ROUTES.pharmacies
);

export const getPharmaciesFromClientApi =
  publicPharmaciesReader.getPharmacies;
export const getPharmacyOptionsFromClientApi = publicPharmaciesReader.getOptions;
export const getPharmacyFiltersFromClientApi = publicPharmaciesReader.getFilters;
export const getPharmacyDetailsFromClientApi = publicPharmaciesReader.getDetails;
export const getPharmacyReviewsFromClientApi = publicPharmaciesReader.getReviews;

//===================================================================

export async function getFavoritePharmaciesFromClientApi(
  params: PharmaciesQueryParams = {},
  options?: JsonResponseRequestOptions
): Promise<PharmaciesResponse> {
  return getResponseData(
    await localApiRequest<ApiSuccessResponse<PharmaciesResponse>>(
      appendQueryParams(ROUTES.pharmacies.favorites, params),
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
