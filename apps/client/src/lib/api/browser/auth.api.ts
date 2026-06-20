import 'client-only';

import { localApiRequest } from './local-api-request';
import { getResponseData } from '@e-pharmacy/api-client/core';
import { clientApiRoutes as CLIENT_API_ROUTES } from '@/lib/api/routes';

import type {
  ApiEmptySuccessResponse,
  ApiSuccessResponse,
  AuthResponse,
  CurrentUserResponse,
  ForgotPasswordPayload,
  LoginPayload,
  RegisterPayload,
  ResetPasswordPayload,
  UpdatePasswordPayload,
  UpdateProfilePayload,
  ActiveSessionsResponse,
} from '@e-pharmacy/types';

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
  await localApiRequest<ApiEmptySuccessResponse>(
    CLIENT_API_ROUTES.auth.passwordResetRequest,
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
  await localApiRequest<ApiEmptySuccessResponse>(
    CLIENT_API_ROUTES.auth.passwordResetConfirm,
    {
      method: 'POST',
      body: payload,
    }
  );
}

//===================================================================

export async function refreshSession(): Promise<CurrentUserResponse> {
  const response = await localApiRequest<
    ApiSuccessResponse<CurrentUserResponse>
  >(CLIENT_API_ROUTES.auth.refresh, {
    method: 'POST',
  });

  return getResponseData(response);
}

//===================================================================

export async function getCurrentUser(): Promise<CurrentUserResponse> {
  const response = await localApiRequest<
    ApiSuccessResponse<CurrentUserResponse>
  >(CLIENT_API_ROUTES.auth.current);

  return getResponseData(response);
}

//===================================================================

export async function logoutUser(): Promise<void> {
  await localApiRequest<ApiEmptySuccessResponse>(
    CLIENT_API_ROUTES.auth.logout,
    {
      method: 'POST',
    }
  );
}

//===================================================================

export async function logoutAllUserSessions(): Promise<void> {
  await localApiRequest<ApiEmptySuccessResponse>(
    CLIENT_API_ROUTES.auth.logoutAll,
    {
      method: 'POST',
    }
  );
}

//===================================================================

export async function updateCurrentUser(
  payload: UpdateProfilePayload
): Promise<CurrentUserResponse> {
  const response = await localApiRequest<
    ApiSuccessResponse<CurrentUserResponse>
  >(CLIENT_API_ROUTES.auth.current, {
    method: 'PATCH',
    body: payload,
  });

  return getResponseData(response);
}

//===================================================================

export async function updateCurrentUserPassword(
  payload: UpdatePasswordPayload
): Promise<void> {
  await localApiRequest<ApiEmptySuccessResponse>(
    CLIENT_API_ROUTES.auth.password,
    {
      method: 'PATCH',
      body: payload,
    }
  );
}

//===================================================================

export async function getActiveSessions(): Promise<ActiveSessionsResponse> {
  const response = await localApiRequest<
    ApiSuccessResponse<ActiveSessionsResponse>
  >(CLIENT_API_ROUTES.auth.sessions);
  return getResponseData(response);
}

//===================================================================

export async function revokeActiveSession(sessionId: string): Promise<void> {
  await localApiRequest<ApiEmptySuccessResponse>(
    CLIENT_API_ROUTES.auth.session(sessionId),
    { method: 'DELETE' }
  );
}
