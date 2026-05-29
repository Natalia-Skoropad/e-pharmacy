import { bffApiRequest } from '@/lib/api/bff-api';

import {
  buildQueryString,
  getResponseData,
  localApiRequest,
  type RequestOptions,
} from '@/lib/api';

import { API_ROUTES } from '@/lib/constants/api-routes';
import { CLIENT_API_ROUTES } from '@/lib/constants/client-api-routes';

import type {
  ApiSuccessResponse,
  CreateStoreReviewPayload,
  CreateStoreReviewResponse,
  StoreDetailsResponse,
  StoreFilterOptionsResponse,
  StoreReviewsResponse,
  StoresResponse,
  StoresSortFilter,
  ToggleFavoriteStoreResponse,
} from '@/types';

//===================================================================

type StoresQueryParams = {
  page?: number;
  perPage?: number;
  keyword?: string;
  nameKeyword?: string;
  addressKeyword?: string;
  city?: string;
  sort?: StoresSortFilter;
};

//===================================================================

export async function getStores(
  params: StoresQueryParams = {},
  requestOptions?: RequestOptions
): Promise<StoresResponse> {
  const queryString = buildQueryString(params);

  const response = await bffApiRequest<ApiSuccessResponse<StoresResponse>>(
    `${API_ROUTES.stores.list}${queryString}`,
    `${CLIENT_API_ROUTES.stores.list}${queryString}`,
    requestOptions
  );

  return getResponseData(response);
}

//===================================================================

export async function getStoreFilters(
  requestOptions?: RequestOptions
): Promise<StoreFilterOptionsResponse> {
  const response = await bffApiRequest<
    ApiSuccessResponse<StoreFilterOptionsResponse>
  >(
    API_ROUTES.stores.filters,
    CLIENT_API_ROUTES.stores.filters,
    requestOptions
  );

  return getResponseData(response);
}

//===================================================================

export async function getStoreDetails(
  storeId: string,
  requestOptions?: RequestOptions
): Promise<StoreDetailsResponse> {
  const response = await bffApiRequest<
    ApiSuccessResponse<StoreDetailsResponse>
  >(
    API_ROUTES.stores.details(storeId),
    CLIENT_API_ROUTES.stores.details(storeId),
    requestOptions
  );

  return getResponseData(response);
}

//===================================================================

export async function getStoreReviews(
  storeId: string,
  requestOptions?: RequestOptions
): Promise<StoreReviewsResponse> {
  const response = await bffApiRequest<
    ApiSuccessResponse<StoreReviewsResponse>
  >(
    API_ROUTES.stores.reviews(storeId),
    CLIENT_API_ROUTES.stores.reviews(storeId),
    requestOptions
  );

  return getResponseData(response);
}

//===================================================================

export async function createStoreReview(
  storeId: string,
  payload: CreateStoreReviewPayload
): Promise<CreateStoreReviewResponse> {
  const response = await localApiRequest<
    ApiSuccessResponse<CreateStoreReviewResponse>
  >(CLIENT_API_ROUTES.stores.reviews(storeId), {
    method: 'POST',
    body: payload,
  });

  return getResponseData(response);
}

//===================================================================

export async function toggleFavoriteStore(
  storeId: string
): Promise<ToggleFavoriteStoreResponse> {
  const response = await localApiRequest<
    ApiSuccessResponse<ToggleFavoriteStoreResponse>
  >(CLIENT_API_ROUTES.stores.favorite(storeId), {
    method: 'PATCH',
  });

  return getResponseData(response);
}
