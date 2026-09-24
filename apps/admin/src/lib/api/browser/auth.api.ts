import 'client-only';

import {
  parseApiEmptyResponse,
  parseApiResponseData,
} from '@e-pharmacy/api-client/response';

import { localApiRequest } from '@e-pharmacy/next-api/browser';

import type {
  AuthResponse,
  ForgotPasswordPayload,
  LoginPayload,
  ResetPasswordPayload,
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
