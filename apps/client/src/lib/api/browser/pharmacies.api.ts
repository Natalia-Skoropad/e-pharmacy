import 'client-only';

import {
  appendQueryParams,
  type JsonResponseRequestOptions,
} from '@e-pharmacy/api-client/transport';

import {
  parseApiResponseData,
  parseFavoriteIdsResponse,
  parseFavoriteMutationResponse,
  parsePharmaciesResponse,
  parsePharmacyCheckoutDetailsResponse,
  parseReviewMutationResponse,
} from '@e-pharmacy/api-client/response';

import { localApiRequest } from '@e-pharmacy/next-api/browser';

import type {
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

const publicPharmaciesReader =
  createPublicPharmaciesReader<JsonResponseRequestOptions>(
    (path, options) => localApiRequest(path, options),
    ROUTES.pharmacies
  );

export const getPharmaciesFromClientApi = publicPharmaciesReader.getPharmacies;
export const getPharmacyOptionsFromClientApi =
  publicPharmaciesReader.getOptions;
export const getPharmacyFiltersFromClientApi =
  publicPharmaciesReader.getFilters;
export const getPharmacyDetailsFromClientApi =
  publicPharmaciesReader.getDetails;
export const getPharmacyReviewsFromClientApi =
  publicPharmaciesReader.getReviews;

//===================================================================

export async function getFavoritePharmaciesFromClientApi(
  params: PharmaciesQueryParams = {},
  options?: JsonResponseRequestOptions
): Promise<PharmaciesResponse> {
  const path = appendQueryParams(ROUTES.pharmacies.favorites, params);

  return parseApiResponseData(
    await localApiRequest(path, options),
    parsePharmaciesResponse,
    { url: path, method: 'GET' }
  );
}

//===================================================================

export async function getFavoritePharmacyIdsFromClientApi(
  options?: JsonResponseRequestOptions
): Promise<FavoriteIdsResponse> {
  const path = ROUTES.pharmacies.favoriteIds;

  return parseApiResponseData(
    await localApiRequest(path, options),
    parseFavoriteIdsResponse,
    { url: path, method: 'GET' }
  );
}

//===================================================================

export async function getPharmacyCheckoutDetails(
  id: string,
  options?: JsonResponseRequestOptions
): Promise<PharmacyCheckoutDetailsResponse> {
  const path = ROUTES.pharmacies.checkoutDetails(id);

  return parseApiResponseData(
    await localApiRequest(path, options),
    parsePharmacyCheckoutDetailsResponse,
    { url: path, method: 'GET' }
  );
}

//===================================================================

export async function createPharmacyReview(
  id: string,
  payload: CreateReviewPayload
): Promise<ReviewMutationResponse> {
  const path = ROUTES.pharmacies.reviews(id);

  return parseApiResponseData(
    await localApiRequest(path, { method: 'POST', body: payload }),
    parseReviewMutationResponse,
    { url: path, method: 'POST' }
  );
}

//===================================================================

export async function addFavoritePharmacy(
  id: string
): Promise<FavoriteMutationResponse> {
  const path = ROUTES.pharmacies.favorite(id);

  return parseApiResponseData(
    await localApiRequest(path, { method: 'PUT' }),
    parseFavoriteMutationResponse,
    { url: path, method: 'PUT' }
  );
}

//===================================================================

export async function removeFavoritePharmacy(
  id: string
): Promise<FavoriteMutationResponse> {
  const path = ROUTES.pharmacies.favorite(id);

  return parseApiResponseData(
    await localApiRequest(path, { method: 'DELETE' }),
    parseFavoriteMutationResponse,
    { url: path, method: 'DELETE' }
  );
}
