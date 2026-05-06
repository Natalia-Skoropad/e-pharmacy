import { apiRequest, buildQueryString, getResponseData } from '@/lib/api';
import { API_ROUTES } from '@/lib/constants/api-routes';

import type {
  ApiSuccessResponse,
  StoreDetailsResponse,
  StoresResponse,
} from '@/types';

//===================================================================

type StoresQueryParams = {
  page?: number;
  perPage?: number;
  keyword?: string;
  city?: string;
};

//===================================================================

export async function getStores(
  params: StoresQueryParams = {}
): Promise<StoresResponse> {
  const queryString = buildQueryString(params);

  const response = await apiRequest<ApiSuccessResponse<StoresResponse>>(
    `${API_ROUTES.stores.list}${queryString}`
  );

  return getResponseData(response);
}

//===================================================================

export async function getStoreDetails(
  storeId: string
): Promise<StoreDetailsResponse> {
  const response = await apiRequest<ApiSuccessResponse<StoreDetailsResponse>>(
    API_ROUTES.stores.details(storeId)
  );

  return getResponseData(response);
}
