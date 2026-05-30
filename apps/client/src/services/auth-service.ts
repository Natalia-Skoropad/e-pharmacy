import { getResponseData, localApiRequest } from '@/lib/api';
import { CLIENT_API_ROUTES } from '@/lib/constants/client-api-routes';

import type {
  ApiSuccessResponse,
  AuthResponse,
  CurrentUserResponse,
  ForgotPasswordPayload,
  LoginPayload,
  RegisterPayload,
  ResetPasswordPayload,
  UpdatePasswordPayload,
  UpdateProfilePayload,
} from '@/types';

//===================================================================

export async function registerUser(
  payload: RegisterPayload
): Promise<AuthResponse> {
  const response = await localApiRequest<ApiSuccessResponse<AuthResponse>>(
    CLIENT_API_ROUTES.auth.register,
    {
      method: 'POST',
      body: payload,
    }
  );

  return getResponseData(response);
}

//===================================================================

export async function loginUser(payload: LoginPayload): Promise<AuthResponse> {
  const response = await localApiRequest<ApiSuccessResponse<AuthResponse>>(
    CLIENT_API_ROUTES.auth.login,
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
  await localApiRequest<ApiSuccessResponse>(
    CLIENT_API_ROUTES.auth.forgotPassword,
    {
      method: 'POST',
      body: payload,
    }
  );
}

//===================================================================

export async function resetPassword(
  payload: ResetPasswordPayload
): Promise<void> {
  await localApiRequest<ApiSuccessResponse>(
    CLIENT_API_ROUTES.auth.resetPassword,
    {
      method: 'POST',
      body: payload,
    }
  );
}

//===================================================================

export async function refreshSession(): Promise<CurrentUserResponse> {
  const response = await localApiRequest<ApiSuccessResponse<CurrentUserResponse>>(
    CLIENT_API_ROUTES.auth.refresh,
    {
      method: 'POST',
    }
  );

  return getResponseData(response);
}

//===================================================================

export async function getCurrentUser(): Promise<CurrentUserResponse> {
  const response = await localApiRequest<ApiSuccessResponse<CurrentUserResponse>>(
    CLIENT_API_ROUTES.auth.current
  );

  return getResponseData(response);
}

//===================================================================

export async function logoutUser(): Promise<void> {
  await localApiRequest<ApiSuccessResponse>(CLIENT_API_ROUTES.auth.logout, {
    method: 'POST',
  });
}

//===================================================================

export async function logoutAllUserSessions(): Promise<void> {
  await localApiRequest<ApiSuccessResponse>(CLIENT_API_ROUTES.auth.logoutAll, {
    method: 'POST',
  });
}

//===================================================================

export async function updateCurrentUser(
  payload: UpdateProfilePayload
): Promise<CurrentUserResponse> {
  const response = await localApiRequest<ApiSuccessResponse<CurrentUserResponse>>(
    CLIENT_API_ROUTES.auth.current,
    {
      method: 'PATCH',
      body: payload,
    }
  );

  return getResponseData(response);
}

//===================================================================

export async function updateCurrentUserPassword(
  payload: UpdatePasswordPayload
): Promise<void> {
  await localApiRequest<ApiSuccessResponse>(CLIENT_API_ROUTES.auth.password, {
    method: 'PATCH',
    body: payload,
  });
}
