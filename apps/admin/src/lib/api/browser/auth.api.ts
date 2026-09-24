import 'client-only';

import {
  parseActiveSessionsResponse,
  parseApiEmptyResponse,
  parseApiResponseData,
} from '@e-pharmacy/api-client/response';

import { localApiRequest } from '@e-pharmacy/next-api/browser';

import type {
  ActiveSessionsResponse,
  AuthResponse,
  ForgotPasswordPayload,
  LoginPayload,
  ResetPasswordPayload,
  UpdatePasswordPayload,
} from '@e-pharmacy/types/auth';

import { parseAuthResponse } from '@e-pharmacy/validation/auth';

import { adminApiRoutes as ADMIN_API_ROUTES } from '@/lib/api/routes/admin-api-routes';

//===================================================================

type RequestOptions = Readonly<{
  signal?: AbortSignal;
}>;

//===================================================================

export async function loginUser(
  payload: LoginPayload,
  options?: RequestOptions
): Promise<AuthResponse> {
  const path = ADMIN_API_ROUTES.auth.login;

  return parseApiResponseData(
    await localApiRequest(path, {
      method: 'POST',
      body: payload,
      signal: options?.signal,
    }),
    parseAuthResponse,
    { url: path, method: 'POST' }
  );
}

//===================================================================

export async function requestPasswordReset(
  payload: ForgotPasswordPayload,
  options?: RequestOptions
): Promise<void> {
  const path = ADMIN_API_ROUTES.auth.passwordResetRequest;

  parseApiEmptyResponse(
    await localApiRequest(path, {
      method: 'POST',
      body: payload,
      signal: options?.signal,
    }),
    { url: path, method: 'POST' }
  );
}

//===================================================================

export async function resetPassword(
  payload: ResetPasswordPayload,
  options?: RequestOptions
): Promise<void> {
  const path = ADMIN_API_ROUTES.auth.passwordResetConfirm;

  parseApiEmptyResponse(
    await localApiRequest(path, {
      method: 'POST',
      body: payload,
      signal: options?.signal,
    }),
    { url: path, method: 'POST' }
  );
}

//===================================================================

export async function getCurrentUser(
  options?: RequestOptions
): Promise<AuthResponse> {
  const path = ADMIN_API_ROUTES.auth.current;

  return parseApiResponseData(
    await localApiRequest(path, { signal: options?.signal }),
    parseAuthResponse,
    { url: path, method: 'GET' }
  );
}

//===================================================================

export async function logoutUser(options?: RequestOptions): Promise<void> {
  const path = ADMIN_API_ROUTES.auth.logout;

  parseApiEmptyResponse(
    await localApiRequest(path, {
      method: 'POST',
      signal: options?.signal,
    }),
    { url: path, method: 'POST' }
  );
}

//===================================================================

export async function logoutAllUser(options?: RequestOptions): Promise<void> {
  const path = ADMIN_API_ROUTES.auth.logoutAll;

  parseApiEmptyResponse(
    await localApiRequest(path, {
      method: 'POST',
      signal: options?.signal,
    }),
    { url: path, method: 'POST' }
  );
}

//===================================================================

export async function updateCurrentUserPassword(
  payload: UpdatePasswordPayload,
  options?: RequestOptions
): Promise<void> {
  const path = ADMIN_API_ROUTES.auth.password;

  parseApiEmptyResponse(
    await localApiRequest(path, {
      method: 'PATCH',
      body: payload,
      signal: options?.signal,
    }),
    { url: path, method: 'PATCH' }
  );
}

//===================================================================

export async function getActiveSessions(
  options?: RequestOptions
): Promise<ActiveSessionsResponse> {
  const path = ADMIN_API_ROUTES.auth.sessions;

  return parseApiResponseData(
    await localApiRequest(path, { signal: options?.signal }),
    parseActiveSessionsResponse,
    { url: path, method: 'GET' }
  );
}

//===================================================================

export async function revokeActiveSession(
  sessionId: string,
  options?: RequestOptions
): Promise<void> {
  const path = ADMIN_API_ROUTES.auth.session(sessionId);

  parseApiEmptyResponse(
    await localApiRequest(path, {
      method: 'DELETE',
      signal: options?.signal,
    }),
    { url: path, method: 'DELETE' }
  );
}
