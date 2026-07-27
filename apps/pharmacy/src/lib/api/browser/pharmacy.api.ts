import 'client-only';

import {
  getResponseData,
  type JsonResponseRequestOptions,
} from '@e-pharmacy/api-client/core';

import { localApiRequest } from '@e-pharmacy/next-api/browser';
import { parseAuthResponse } from '@e-pharmacy/validation/auth';

import type {
  ApiEmptySuccessResponse,
  ApiSuccessResponse,
} from '@e-pharmacy/types/api';

import type {
  ActiveSessionsResponse,
  AuthResponse,
  UpdatePasswordPayload,
  UpdateProfilePayload,
} from '@e-pharmacy/types/auth';

import type {
  PharmacyProfileResponse,
  SendPharmacyForVerificationResponse,
  UpdateMyPharmacyProfilePayload,
} from '@e-pharmacy/types/pharmacies';

import { pharmacyApiRoutes as PHARMACY_API_ROUTES } from '@/lib/api/routes/pharmacy-api-routes';

//===================================================================

export async function getMyPharmacyProfile(
  options?: JsonResponseRequestOptions
): Promise<PharmacyProfileResponse> {
  const response = await localApiRequest<
    ApiSuccessResponse<PharmacyProfileResponse>
  >(PHARMACY_API_ROUTES.pharmacies.myProfile, options);

  return getResponseData(response);
}

//===================================================================

export async function updateMyPharmacyProfile(
  payload: UpdateMyPharmacyProfilePayload
): Promise<PharmacyProfileResponse> {
  const response = await localApiRequest<
    ApiSuccessResponse<PharmacyProfileResponse>
  >(PHARMACY_API_ROUTES.pharmacies.myProfile, {
    method: 'PATCH',
    body: payload,
  });

  return getResponseData(response);
}

//===================================================================

export async function sendMyPharmacyForVerification(): Promise<SendPharmacyForVerificationResponse> {
  const response = await localApiRequest<
    ApiSuccessResponse<SendPharmacyForVerificationResponse>
  >(PHARMACY_API_ROUTES.pharmacies.sendMyProfileForVerification, {
    method: 'POST',
    body: {},
  });

  return getResponseData(response);
}

//===================================================================

export async function updateCurrentUser(
  payload: UpdateProfilePayload
): Promise<AuthResponse> {
  const response = await localApiRequest<ApiSuccessResponse<unknown>>(
    PHARMACY_API_ROUTES.auth.current,
    {
      method: 'PATCH',
      body: payload,
    }
  );

  return parseAuthResponse(getResponseData(response));
}

//===================================================================

export async function updateCurrentUserPassword(
  payload: UpdatePasswordPayload
): Promise<void> {
  await localApiRequest<ApiEmptySuccessResponse>(
    PHARMACY_API_ROUTES.auth.password,
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
  >(PHARMACY_API_ROUTES.auth.sessions, options);

  return getResponseData(response);
}

//===================================================================

export async function revokeActiveSession(sessionId: string): Promise<void> {
  await localApiRequest<ApiEmptySuccessResponse>(
    PHARMACY_API_ROUTES.auth.session(sessionId),
    {
      method: 'DELETE',
    }
  );
}
