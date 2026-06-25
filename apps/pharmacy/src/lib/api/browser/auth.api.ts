import 'client-only';

import { getResponseData } from '@e-pharmacy/api-client/core';

import type {
  ApiEmptySuccessResponse,
  ApiSuccessResponse,
  AuthResponse,
  CurrentUserResponse,
  LoginPayload,
} from '@e-pharmacy/types';

import { pharmacyApiRoutes as PHARMACY_API_ROUTES } from '@/lib/api/routes';

import { localApiRequest } from './local-api-request';

//===================================================================

export async function loginUser(payload: LoginPayload): Promise<AuthResponse> {
  const response = await localApiRequest<ApiSuccessResponse<AuthResponse>>(
    PHARMACY_API_ROUTES.auth.login,
    {
      method: 'POST',
      body: payload,
    }
  );

  return getResponseData(response);
}

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
