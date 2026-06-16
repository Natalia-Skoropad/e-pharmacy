import { bffApiRequest } from '../core';
import { buildQueryString } from '../core/build-query-string';

import { getResponseData, localApiRequest, type RequestOptions } from '../core';

import { apiRoutes as API_ROUTES } from '../routes';
import { clientApiRoutes as CLIENT_API_ROUTES } from '../routes';

import type {
  ApiSuccessResponse,
  CreatePharmacyReviewPayload,
  CreatePharmacyReviewResponse,
  PharmacyDetailsResponse,
  PharmacyFilterOptionsResponse,
  PharmacyReviewsResponse,
  PharmaciesQueryParams,
  PharmaciesResponse,
  FavoritePharmacyResponse,
} from '@e-pharmacy/types';

//===================================================================

export async function getPharmacies(
  params: PharmaciesQueryParams = {},
  requestOptions?: RequestOptions
): Promise<PharmaciesResponse> {
  const queryString = buildQueryString(params);

  const response = await bffApiRequest<ApiSuccessResponse<PharmaciesResponse>>(
    `${API_ROUTES.pharmacies.list}${queryString}`,
    `${CLIENT_API_ROUTES.pharmacies.list}${queryString}`,
    requestOptions
  );

  return getResponseData(response);
}

//===================================================================

export async function getPharmacyFilters(
  requestOptions?: RequestOptions
): Promise<PharmacyFilterOptionsResponse> {
  const response = await bffApiRequest<
    ApiSuccessResponse<PharmacyFilterOptionsResponse>
  >(
    API_ROUTES.pharmacies.filters,
    CLIENT_API_ROUTES.pharmacies.filters,
    requestOptions
  );

  return getResponseData(response);
}

//===================================================================

export async function getPharmacyDetails(
  pharmacyId: string,
  requestOptions?: RequestOptions
): Promise<PharmacyDetailsResponse> {
  const response = await bffApiRequest<
    ApiSuccessResponse<PharmacyDetailsResponse>
  >(
    API_ROUTES.pharmacies.details(pharmacyId),
    CLIENT_API_ROUTES.pharmacies.details(pharmacyId),
    requestOptions
  );

  return getResponseData(response);
}

//===================================================================

export async function getPharmacyReviews(
  pharmacyId: string,
  requestOptions?: RequestOptions
): Promise<PharmacyReviewsResponse> {
  const response = await bffApiRequest<
    ApiSuccessResponse<PharmacyReviewsResponse>
  >(
    API_ROUTES.pharmacies.reviews(pharmacyId),
    CLIENT_API_ROUTES.pharmacies.reviews(pharmacyId),
    requestOptions
  );

  return getResponseData(response);
}

//===================================================================

export async function createPharmacyReview(
  pharmacyId: string,
  payload: CreatePharmacyReviewPayload
): Promise<CreatePharmacyReviewResponse> {
  const response = await localApiRequest<
    ApiSuccessResponse<CreatePharmacyReviewResponse>
  >(CLIENT_API_ROUTES.pharmacies.reviews(pharmacyId), {
    method: 'POST',
    body: payload,
  });

  return getResponseData(response);
}

//===================================================================

export async function addFavoritePharmacy(
  pharmacyId: string
): Promise<FavoritePharmacyResponse> {
  const response = await localApiRequest<
    ApiSuccessResponse<FavoritePharmacyResponse>
  >(CLIENT_API_ROUTES.pharmacies.favorite(pharmacyId), { method: 'PUT' });
  return getResponseData(response);
}

//===================================================================

export async function removeFavoritePharmacy(
  pharmacyId: string
): Promise<FavoritePharmacyResponse> {
  const response = await localApiRequest<
    ApiSuccessResponse<FavoritePharmacyResponse>
  >(CLIENT_API_ROUTES.pharmacies.favorite(pharmacyId), { method: 'DELETE' });
  return getResponseData(response);
}
