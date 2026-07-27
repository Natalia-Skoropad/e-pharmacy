import 'client-only';

import { localApiRequest } from '@e-pharmacy/next-api/browser';

import {
  getResponseData,
  type JsonResponseRequestOptions,
} from '@e-pharmacy/api-client/core';

import type {
  ApiEmptySuccessResponse,
  ApiSuccessResponse,
} from '@e-pharmacy/types/api';

import type {
  AuthResponse,
  ForgotPasswordPayload,
  LoginPayload,
  RegisterPayload,
  ResetPasswordPayload,
  UpdatePasswordPayload,
  UpdateProfilePayload,
  ActiveSessionsResponse,
} from '@e-pharmacy/types/auth';

import { clientApiRoutes as CLIENT_API_ROUTES } from '@/lib/api/routes';

//===================================================================

export async function registerUser(
  payload: RegisterPayload,
  options?: { signal?: AbortSignal }
): Promise<AuthResponse> {
  const response = await localApiRequest<ApiSuccessResponse<AuthResponse>>(
    CLIENT_API_ROUTES.auth.register,
    {
      method: 'POST',
      body: payload,
      signal: options?.signal,
    }
  );

  return getResponseData(response);
}

//===================================================================

export async function loginUser(
  payload: LoginPayload,
  options?: { signal?: AbortSignal }
): Promise<AuthResponse> {
  const response = await localApiRequest<ApiSuccessResponse<AuthResponse>>(
    CLIENT_API_ROUTES.auth.login,
    {
      method: 'POST',
      body: payload,
      signal: options?.signal,
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

export async function getCurrentUser(
  options?: { signal?: AbortSignal }
): Promise<AuthResponse> {
  const response = await localApiRequest<ApiSuccessResponse<AuthResponse>>(
    CLIENT_API_ROUTES.auth.current,
    { signal: options?.signal }
  );

  return getResponseData(response);
}

//===================================================================

export async function logoutUser(
  options?: { signal?: AbortSignal }
): Promise<void> {
  await localApiRequest<ApiEmptySuccessResponse>(
    CLIENT_API_ROUTES.auth.logout,
    {
      method: 'POST',
      signal: options?.signal,
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
): Promise<AuthResponse> {
  const response = await localApiRequest<ApiSuccessResponse<AuthResponse>>(
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
  await localApiRequest<ApiEmptySuccessResponse>(
    CLIENT_API_ROUTES.auth.password,
    {
      method: 'PATCH',
      body: payload,
    }
  );
}

//===================================================================

export async function getActiveSessions(
  options?: JsonResponseRequestOptions
): Promise<ActiveSessionsResponse> {
  const response = await localApiRequest<
    ApiSuccessResponse<ActiveSessionsResponse>
  >(CLIENT_API_ROUTES.auth.sessions, options);
  return getResponseData(response);
}

//===================================================================

export async function revokeActiveSession(sessionId: string): Promise<void> {
  await localApiRequest<ApiEmptySuccessResponse>(
    CLIENT_API_ROUTES.auth.session(sessionId),
    { method: 'DELETE' }
  );
}
