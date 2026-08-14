import 'client-only';

import type { JsonResponseRequestOptions } from '@e-pharmacy/api-client/transport';

import {
  parseActiveSessionsResponse,
  parseApiEmptyResponse,
  parseApiResponseData,
  parsePharmacyDocumentContentResponse,
  parsePharmacyProfileDocumentUploadResponse,
  parsePharmacyProfileResponse,
  parseSendPharmacyForVerificationResponse,
} from '@e-pharmacy/api-client/response';

import { localApiRequest } from '@e-pharmacy/next-api/browser';
import { parseAuthResponse } from '@e-pharmacy/validation/auth';

import type {
  ActiveSessionsResponse,
  AuthResponse,
  UpdatePasswordPayload,
  UpdateProfilePayload,
} from '@e-pharmacy/types/auth';

import type {
  PharmacyDocumentContentResponse,
  PharmacyDocumentUploadPayload,
  PharmacyProfileDocumentUploadResponse,
  PharmacyProfileResponse,
  SendPharmacyForVerificationResponse,
  SubmitMyPharmacyModerationPayload,
  UpdateMyPharmacyProfilePayload,
} from '@e-pharmacy/types/pharmacies';

import type { EntityId } from '@e-pharmacy/types/primitives';

import { pharmacyApiRoutes as PHARMACY_API_ROUTES } from '@/lib/api/routes/pharmacy-api-routes';

//===================================================================

export async function uploadMyPharmacyDocument(
  payload: PharmacyDocumentUploadPayload
): Promise<PharmacyProfileDocumentUploadResponse> {
  const path = PHARMACY_API_ROUTES.pharmacies.myDocumentUpload;

  return parseApiResponseData(
    await localApiRequest(path, { method: 'POST', body: payload }),
    parsePharmacyProfileDocumentUploadResponse,
    { url: path, method: 'POST' }
  );
}

//===================================================================

export async function getMyPharmacyDocument(
  documentId: EntityId,
  options?: JsonResponseRequestOptions
): Promise<PharmacyDocumentContentResponse> {
  const path = PHARMACY_API_ROUTES.pharmacies.myDocument(documentId);

  return parseApiResponseData(
    await localApiRequest(path, options),
    parsePharmacyDocumentContentResponse,
    { url: path, method: 'GET' }
  );
}

//===================================================================

export async function getMyPharmacyProfile(
  options?: JsonResponseRequestOptions
): Promise<PharmacyProfileResponse> {
  const path = PHARMACY_API_ROUTES.pharmacies.myProfile;

  return parseApiResponseData(
    await localApiRequest(path, options),
    parsePharmacyProfileResponse,
    { url: path, method: 'GET' }
  );
}

//===================================================================

export async function updateMyPharmacyProfile(
  payload: UpdateMyPharmacyProfilePayload
): Promise<PharmacyProfileResponse> {
  const path = PHARMACY_API_ROUTES.pharmacies.myProfile;

  return parseApiResponseData(
    await localApiRequest(path, { method: 'PATCH', body: payload }),
    parsePharmacyProfileResponse,
    { url: path, method: 'PATCH' }
  );
}

//===================================================================

export async function submitMyPharmacyModeration(
  payload: SubmitMyPharmacyModerationPayload
): Promise<SendPharmacyForVerificationResponse> {
  const path = PHARMACY_API_ROUTES.pharmacies.submitMyProfileForModeration;

  return parseApiResponseData(
    await localApiRequest(path, { method: 'POST', body: payload }),
    parseSendPharmacyForVerificationResponse,
    { url: path, method: 'POST' }
  );
}

//===================================================================

export async function sendMyPharmacyForVerification(): Promise<SendPharmacyForVerificationResponse> {
  const path = PHARMACY_API_ROUTES.pharmacies.sendMyProfileForVerification;

  return parseApiResponseData(
    await localApiRequest(path, { method: 'POST', body: {} }),
    parseSendPharmacyForVerificationResponse,
    { url: path, method: 'POST' }
  );
}

//===================================================================

export async function updateCurrentUser(
  payload: UpdateProfilePayload
): Promise<AuthResponse> {
  const path = PHARMACY_API_ROUTES.auth.current;

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
  const path = PHARMACY_API_ROUTES.auth.password;

  parseApiEmptyResponse(
    await localApiRequest(path, { method: 'PATCH', body: payload }),
    { url: path, method: 'PATCH' }
  );
}

//===================================================================

export async function getActiveSessions(
  options?: JsonResponseRequestOptions
): Promise<ActiveSessionsResponse> {
  const path = PHARMACY_API_ROUTES.auth.sessions;

  return parseApiResponseData(
    await localApiRequest(path, options),
    parseActiveSessionsResponse,
    { url: path, method: 'GET' }
  );
}

//===================================================================

export async function revokeActiveSession(sessionId: string): Promise<void> {
  const path = PHARMACY_API_ROUTES.auth.session(sessionId);

  parseApiEmptyResponse(await localApiRequest(path, { method: 'DELETE' }), {
    url: path,
    method: 'DELETE',
  });
}
