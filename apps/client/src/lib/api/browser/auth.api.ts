import 'client-only';

import {
  parseActiveSessionsResponse,
  parseApiEmptyResponse,
  parseApiResponseData,
  parsePharmacyRegistrationDocumentUploadResponse,
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

import type {
  PharmacyDocumentUploadPayload,
  PharmacyRegistrationDocumentUploadResponse,
} from '@e-pharmacy/types/pharmacies';

import { clientApiRoutes as CLIENT_API_ROUTES } from '@/lib/api/routes/client-api-routes';

import type {
  MutationRequestOptions,
  ReadRequestOptions,
} from '@/lib/api/request-options';

//===================================================================

export async function uploadPharmacyRegistrationDocument(
  payload: PharmacyDocumentUploadPayload,
  options?: MutationRequestOptions
): Promise<PharmacyRegistrationDocumentUploadResponse> {
  const path = CLIENT_API_ROUTES.auth.pharmacyDocumentUpload;

  return parseApiResponseData(
    await localApiRequest(path, {
      ...options,
      method: 'POST',
      body: payload,
    }),
    parsePharmacyRegistrationDocumentUploadResponse,
    { url: path, method: 'POST' }
  );
}

//===================================================================

export async function registerUser(
  payload: RegisterPayload,
  options?: MutationRequestOptions
): Promise<AuthResponse> {
  const path = CLIENT_API_ROUTES.auth.register;

  return parseApiResponseData(
    await localApiRequest(path, {
      ...options,
      method: 'POST',
      body: payload,
    }),

    parseAuthResponse,
    { url: path, method: 'POST' }
  );
}

//===================================================================

export async function loginUser(
  payload: LoginPayload,
  options?: MutationRequestOptions
): Promise<AuthResponse> {
  const path = CLIENT_API_ROUTES.auth.login;

  return parseApiResponseData(
    await localApiRequest(path, {
      ...options,
      method: 'POST',
      body: payload,
    }),

    parseAuthResponse,
    { url: path, method: 'POST' }
  );
}

//===================================================================

export async function requestPasswordReset(
  payload: ForgotPasswordPayload,
  options?: MutationRequestOptions
): Promise<void> {
  const path = CLIENT_API_ROUTES.auth.passwordResetRequest;

  parseApiEmptyResponse(
    await localApiRequest(path, { ...options, method: 'POST', body: payload }),
    { url: path, method: 'POST' }
  );
}

//===================================================================

export async function resetPassword(
  payload: ResetPasswordPayload,
  options?: MutationRequestOptions
): Promise<void> {
  const path = CLIENT_API_ROUTES.auth.passwordResetConfirm;

  parseApiEmptyResponse(
    await localApiRequest(path, { ...options, method: 'POST', body: payload }),
    { url: path, method: 'POST' }
  );
}

//===================================================================

export async function getCurrentUser(
  options?: ReadRequestOptions
): Promise<AuthResponse> {
  const path = CLIENT_API_ROUTES.auth.current;

  return parseApiResponseData(
    await localApiRequest(path, options),
    parseAuthResponse,
    { url: path, method: 'GET' }
  );
}

//===================================================================

export async function logoutUser(
  options?: MutationRequestOptions
): Promise<void> {
  const path = CLIENT_API_ROUTES.auth.logout;

  parseApiEmptyResponse(
    await localApiRequest(path, {
      ...options,
      method: 'POST',
    }),

    { url: path, method: 'POST' }
  );
}

//===================================================================

export async function logoutAllUser(
  options?: MutationRequestOptions
): Promise<void> {
  const path = CLIENT_API_ROUTES.auth.logoutAll;

  parseApiEmptyResponse(
    await localApiRequest(path, {
      ...options,
      method: 'POST',
    }),
    { url: path, method: 'POST' }
  );
}

//===================================================================

export async function updateCurrentUser(
  payload: UpdateProfilePayload,
  options?: MutationRequestOptions
): Promise<AuthResponse> {
  const path = CLIENT_API_ROUTES.auth.current;

  return parseApiResponseData(
    await localApiRequest(path, { ...options, method: 'PATCH', body: payload }),
    parseAuthResponse,
    { url: path, method: 'PATCH' }
  );
}

//===================================================================

export async function updateCurrentUserPassword(
  payload: UpdatePasswordPayload,
  options?: MutationRequestOptions
): Promise<void> {
  const path = CLIENT_API_ROUTES.auth.password;

  parseApiEmptyResponse(
    await localApiRequest(path, { ...options, method: 'PATCH', body: payload }),
    { url: path, method: 'PATCH' }
  );
}

//===================================================================

export async function getActiveSessions(
  options?: ReadRequestOptions
): Promise<ActiveSessionsResponse> {
  const path = CLIENT_API_ROUTES.auth.sessions;

  return parseApiResponseData(
    await localApiRequest(path, options),
    parseActiveSessionsResponse,
    { url: path, method: 'GET' }
  );
}

//===================================================================

export async function revokeActiveSession(
  sessionId: string,
  options?: MutationRequestOptions
): Promise<void> {
  const path = CLIENT_API_ROUTES.auth.session(sessionId);

  parseApiEmptyResponse(
    await localApiRequest(path, { ...options, method: 'DELETE' }),
    { url: path, method: 'DELETE' }
  );
}
