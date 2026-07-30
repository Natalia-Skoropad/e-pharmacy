import 'client-only';

import { appendQueryParams } from '@e-pharmacy/api-client/transport';

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
import { clientApiRoutes as ROUTES } from '@/lib/api/routes/client-api-routes';

import type {
  MutationRequestOptions,
  ReadRequestOptions,
} from '@/lib/api/request-options';

//===================================================================

const publicPharmaciesReader = createPublicPharmaciesReader<ReadRequestOptions>(
  (path, options) => localApiRequest(path, options),
  ROUTES.pharmacies
);

//===================================================================

export const getPharmacies = publicPharmaciesReader.getPharmacies;
export const getPharmacyOptions = publicPharmaciesReader.getOptions;
export const getPharmacyFilters = publicPharmaciesReader.getFilters;
export const getPharmacyDetails = publicPharmaciesReader.getDetails;
export const getPharmacyReviews = publicPharmaciesReader.getReviews;

//===================================================================

export async function getFavoritePharmacies(
  params: PharmaciesQueryParams = {},
  options?: ReadRequestOptions
): Promise<PharmaciesResponse> {
  const path = appendQueryParams(ROUTES.pharmacies.favorites, params);

  return parseApiResponseData(
    await localApiRequest(path, options),
    parsePharmaciesResponse,
    { url: path, method: 'GET' }
  );
}

//===================================================================

export async function getFavoritePharmacyIds(
  options?: ReadRequestOptions
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
  options?: ReadRequestOptions
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
  payload: CreateReviewPayload,
  options?: MutationRequestOptions
): Promise<ReviewMutationResponse> {
  const path = ROUTES.pharmacies.reviews(id);

  return parseApiResponseData(
    await localApiRequest(path, { ...options, method: 'POST', body: payload }),
    parseReviewMutationResponse,
    { url: path, method: 'POST' }
  );
}

//===================================================================

export async function addFavoritePharmacy(
  id: string,
  options?: MutationRequestOptions
): Promise<FavoriteMutationResponse> {
  const path = ROUTES.pharmacies.favorite(id);

  return parseApiResponseData(
    await localApiRequest(path, { ...options, method: 'PUT' }),
    parseFavoriteMutationResponse,
    { url: path, method: 'PUT' }
  );
}

//===================================================================

export async function removeFavoritePharmacy(
  id: string,
  options?: MutationRequestOptions
): Promise<FavoriteMutationResponse> {
  const path = ROUTES.pharmacies.favorite(id);

  return parseApiResponseData(
    await localApiRequest(path, { ...options, method: 'DELETE' }),
    parseFavoriteMutationResponse,
    { url: path, method: 'DELETE' }
  );
}
