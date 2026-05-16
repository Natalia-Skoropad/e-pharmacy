import { apiRequest, getResponseData } from '@/lib/api';
import { API_ROUTES } from '@/lib/constants/api-routes';

import type {
  ApiSuccessResponse,
  AuthResponse,
  CurrentUserResponse,
  ForgotPasswordPayload,
  LoginPayload,
  RegisterPayload,
  UpdatePasswordPayload,
  UpdateProfilePayload,
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

export async function requestPasswordReset(
  payload: ForgotPasswordPayload
): Promise<void> {
  await apiRequest<ApiSuccessResponse>(API_ROUTES.auth.forgotPassword, {
    method: 'POST',
    body: payload,
  });
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


//===================================================================

export async function updateCurrentUser(
  payload: UpdateProfilePayload,
  authToken: string
): Promise<CurrentUserResponse> {
  const response = await apiRequest<ApiSuccessResponse<CurrentUserResponse>>(
    API_ROUTES.auth.current,
    {
      method: 'PATCH',
      body: payload,
      authToken,
    }
  );

  return getResponseData(response);
}

//===================================================================

export async function updateCurrentUserPassword(
  payload: UpdatePasswordPayload,
  authToken: string
): Promise<void> {
  await apiRequest<ApiSuccessResponse>(API_ROUTES.auth.password, {
    method: 'PATCH',
    body: payload,
    authToken,
  });
}
