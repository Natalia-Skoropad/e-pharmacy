import 'client-only';

import { getResponseData } from '@e-pharmacy/api-client/core';

import type {
  ApiEmptySuccessResponse,
  ApiSuccessResponse,
} from '@e-pharmacy/types/api';

import type { AuthResponse } from '@e-pharmacy/types/auth';

import { pharmacyApiRoutes as PHARMACY_API_ROUTES } from '@/lib/api/routes/pharmacy-api-routes';

import { localApiRequest } from '@e-pharmacy/next-api/browser';

//===================================================================

export async function refreshSession(): Promise<AuthResponse> {
  const response = await localApiRequest<ApiSuccessResponse<AuthResponse>>(
    PHARMACY_API_ROUTES.auth.refresh,
    {
      method: 'POST',
    }
  );

  return getResponseData(response);
}

//===================================================================

export async function getCurrentUser(): Promise<AuthResponse> {
  const response = await localApiRequest<ApiSuccessResponse<AuthResponse>>(
    PHARMACY_API_ROUTES.auth.current
  );

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
