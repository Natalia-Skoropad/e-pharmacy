import 'client-only';

import { getResponseData } from '@e-pharmacy/api-client/core';

import type {
  ApiEmptySuccessResponse,
  ApiSuccessResponse,
  CurrentUserResponse,
} from '@e-pharmacy/types';

import { pharmacyApiRoutes as PHARMACY_API_ROUTES } from '@/lib/api/routes/pharmacy-api-routes';

import { localApiRequest } from '@e-pharmacy/next-api/browser';

//===================================================================

export async function refreshSession(): Promise<CurrentUserResponse> {
  const response = await localApiRequest<
    ApiSuccessResponse<CurrentUserResponse>
  >(PHARMACY_API_ROUTES.auth.refresh, {
    method: 'POST',
  });

  return getResponseData(response);
}

//===================================================================

export async function getCurrentUser(): Promise<CurrentUserResponse> {
  const response = await localApiRequest<
    ApiSuccessResponse<CurrentUserResponse>
  >(PHARMACY_API_ROUTES.auth.current);

  return getResponseData(response);
}

//===================================================================

export async function logoutUser(): Promise<void> {
  await localApiRequest<ApiEmptySuccessResponse>(
    PHARMACY_API_ROUTES.auth.logout,
    {
      method: 'POST',
    }
  );
}
