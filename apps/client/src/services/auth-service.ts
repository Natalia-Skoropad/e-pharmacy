import { apiRequest, getResponseData } from '@/lib/api';
import { API_ROUTES } from '@/lib/constants/api-routes';

import type {
  ApiSuccessResponse,
  AuthResponse,
  CurrentUserResponse,
  LoginPayload,
  RegisterPayload,
} from '@/types';

//===================================================================

export async function registerUser(
  payload: RegisterPayload
): Promise<AuthResponse> {
  const response = await apiRequest<ApiSuccessResponse<AuthResponse>>(
    API_ROUTES.auth.register,
    {
      method: 'POST',
      body: payload,
    }
  );

  return getResponseData(response);
}

//===================================================================

export async function loginUser(payload: LoginPayload): Promise<AuthResponse> {
  const response = await apiRequest<ApiSuccessResponse<AuthResponse>>(
    API_ROUTES.auth.login,
    {
      method: 'POST',
      body: payload,
    }
  );

  return getResponseData(response);
}

//===================================================================

export async function getCurrentUser(
  authToken: string
): Promise<CurrentUserResponse> {
  const response = await apiRequest<ApiSuccessResponse<CurrentUserResponse>>(
    API_ROUTES.auth.current,
    {
      authToken,
    }
  );

  return getResponseData(response);
}

//===================================================================

export async function logoutUser(authToken: string): Promise<void> {
  await apiRequest<ApiSuccessResponse>(API_ROUTES.auth.logout, {
    method: 'POST',
    authToken,
  });
}
