import 'client-only';

import type { JsonResponseRequestOptions } from '@e-pharmacy/api-client/transport';

import {
  parseActiveSessionsResponse,
  parseApiEmptyResponse,
  parseApiResponseData,
} from '@e-pharmacy/api-client/response';

import { localApiRequest } from '@e-pharmacy/next-api/browser';
import { parseAuthResponse } from '@e-pharmacy/validation/auth';

import type {
  ActiveSessionsResponse,
  AuthResponse,
  ForgotPasswordPayload,
  LoginPayload,
  RegisterPayload,
  ResetPasswordPayload,
  UpdatePasswordPayload,
  UpdateProfilePayload,
} from '@e-pharmacy/types/auth';

import { clientApiRoutes as CLIENT_API_ROUTES } from '@/lib/api/routes';

//===================================================================

export async function registerUser(
  payload: RegisterPayload,
  options?: { signal?: AbortSignal }
): Promise<AuthResponse> {
  const path = CLIENT_API_ROUTES.auth.register;

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

export async function loginUser(
  payload: LoginPayload,
  options?: { signal?: AbortSignal }
): Promise<AuthResponse> {
  const path = CLIENT_API_ROUTES.auth.login;

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
  payload: ForgotPasswordPayload
): Promise<void> {
  const path = CLIENT_API_ROUTES.auth.passwordResetRequest;
  parseApiEmptyResponse(
    await localApiRequest(path, { method: 'POST', body: payload }),
    { url: path, method: 'POST' }
  );
}

//===================================================================

export async function resetPassword(
  payload: ResetPasswordPayload
): Promise<void> {
  const path = CLIENT_API_ROUTES.auth.passwordResetConfirm;
  parseApiEmptyResponse(
    await localApiRequest(path, { method: 'POST', body: payload }),
    { url: path, method: 'POST' }
  );
}

//===================================================================

export async function getCurrentUser(options?: {
  signal?: AbortSignal;
}): Promise<AuthResponse> {
  const path = CLIENT_API_ROUTES.auth.current;

  return parseApiResponseData(
    await localApiRequest(path, { signal: options?.signal }),
    parseAuthResponse,
    { url: path, method: 'GET' }
  );
}

//===================================================================

export async function logoutUser(options?: {
  signal?: AbortSignal;
}): Promise<void> {
  const path = CLIENT_API_ROUTES.auth.logout;
  parseApiEmptyResponse(
    await localApiRequest(path, {
      method: 'POST',
      signal: options?.signal,
    }),
    { url: path, method: 'POST' }
  );
}

//===================================================================

export async function logoutAllUserSessions(): Promise<void> {
  const path = CLIENT_API_ROUTES.auth.logoutAll;
  parseApiEmptyResponse(await localApiRequest(path, { method: 'POST' }), {
    url: path,
    method: 'POST',
  });
}

//===================================================================

export async function updateCurrentUser(
  payload: UpdateProfilePayload
): Promise<AuthResponse> {
  const path = CLIENT_API_ROUTES.auth.current;

  return parseApiResponseData(
    await localApiRequest(path, { method: 'PATCH', body: payload }),
    parseAuthResponse,
    { url: path, method: 'PATCH' }
  );
}

//===================================================================

export async function updateCurrentUserPassword(
  payload: UpdatePasswordPayload
): Promise<void> {
  const path = CLIENT_API_ROUTES.auth.password;
  parseApiEmptyResponse(
    await localApiRequest(path, { method: 'PATCH', body: payload }),
    { url: path, method: 'PATCH' }
  );
}

//===================================================================

export async function getActiveSessions(
  options?: JsonResponseRequestOptions
): Promise<ActiveSessionsResponse> {
  const path = CLIENT_API_ROUTES.auth.sessions;

  return parseApiResponseData(
    await localApiRequest(path, options),
    parseActiveSessionsResponse,
    { url: path, method: 'GET' }
  );
}

//===================================================================

export async function revokeActiveSession(sessionId: string): Promise<void> {
  const path = CLIENT_API_ROUTES.auth.session(sessionId);
  parseApiEmptyResponse(await localApiRequest(path, { method: 'DELETE' }), {
    url: path,
    method: 'DELETE',
  });
}
