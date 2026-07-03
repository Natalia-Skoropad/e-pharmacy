import 'client-only';

import { getResponseData } from '@e-pharmacy/api-client/core';

import type {
  ActiveSessionsResponse,
  ApiEmptySuccessResponse,
  ApiSuccessResponse,
  CurrentUserResponse,
  PharmacyProfileResponse,
  SendPharmacyForVerificationResponse,
  UpdateMyPharmacyProfilePayload,
  UpdatePasswordPayload,
  UpdateProfilePayload,
} from '@e-pharmacy/types';

import { pharmacyApiRoutes as PHARMACY_API_ROUTES } from '@/lib/api/routes/pharmacy-api-routes';

import { localApiRequest } from '@e-pharmacy/next-api/browser';

//===================================================================

export async function getMyPharmacyProfile(): Promise<PharmacyProfileResponse> {
  const response = await localApiRequest<ApiSuccessResponse<PharmacyProfileResponse>>(
    PHARMACY_API_ROUTES.pharmacies.myProfile
  );

  return getResponseData(response);
}

//===================================================================

export async function updateMyPharmacyProfile(
  payload: UpdateMyPharmacyProfilePayload
): Promise<PharmacyProfileResponse> {
  const response = await localApiRequest<ApiSuccessResponse<PharmacyProfileResponse>>(
    PHARMACY_API_ROUTES.pharmacies.myProfile,
    {
      method: 'PATCH',
      body: payload,
    }
  );

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
): Promise<CurrentUserResponse> {
  const response = await localApiRequest<ApiSuccessResponse<CurrentUserResponse>>(
    PHARMACY_API_ROUTES.auth.current,
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
  await localApiRequest<ApiEmptySuccessResponse>(PHARMACY_API_ROUTES.auth.password, {
    method: 'PATCH',
    body: payload,
  });
}

//===================================================================

export async function getActiveSessions(): Promise<ActiveSessionsResponse> {
  const response = await localApiRequest<ApiSuccessResponse<ActiveSessionsResponse>>(
    PHARMACY_API_ROUTES.auth.sessions
  );

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
