import 'client-only';

import {
  parseApiResponseData,
  parsePharmacyProfileResponse,
  parsePharmacyProfileDocumentUploadResponse,
  parseSendPharmacyForVerificationResponse,
} from '@e-pharmacy/api-client/response';

import { localApiRequest } from '@e-pharmacy/next-api/browser';

import type {
  PharmacyProfileResponse,
  PharmacyProfileUpdateChanges,
  PharmacyDocumentUploadPayload,
  PharmacyProfileDocumentUploadResponse,
  SendPharmacyForVerificationResponse,
} from '@e-pharmacy/types/pharmacies';

import { pharmacyApiRoutes } from '@/lib/api/routes/pharmacy-api-routes';

//===================================================================

// Use the same validated DTO parsers as the existing pharmacy profile UI.
export async function createOwnedPharmacyDraft(
  payload: PharmacyProfileUpdateChanges & { clientRequestId: string }
): Promise<PharmacyProfileResponse> {
  const url = pharmacyApiRoutes.pharmacies.createDraft;

  return parseApiResponseData(
    await localApiRequest(url, { method: 'POST', body: payload }),

    parsePharmacyProfileResponse,

    { url, method: 'POST' }
  );
}

//===================================================================

export async function getOwnedPharmacyProfile(
  pharmacyId: string
): Promise<PharmacyProfileResponse> {
  const url = pharmacyApiRoutes.pharmacies.ownedProfile(pharmacyId);

  return parseApiResponseData(
    await localApiRequest(url),

    parsePharmacyProfileResponse,

    { url, method: 'GET' }
  );
}

//===================================================================

export async function updateOwnedPharmacyDraft(
  pharmacyId: string,
  payload: PharmacyProfileUpdateChanges & { expectedRevision: string }
): Promise<PharmacyProfileResponse> {
  const url = pharmacyApiRoutes.pharmacies.ownedProfile(pharmacyId);

  return parseApiResponseData(
    await localApiRequest(url, { method: 'PATCH', body: payload }),

    parsePharmacyProfileResponse,

    { url, method: 'PATCH' }
  );
}

//===================================================================

export async function uploadOwnedPharmacyDocument(
  pharmacyId: string,
  payload: PharmacyDocumentUploadPayload
): Promise<PharmacyProfileDocumentUploadResponse> {
  const url = pharmacyApiRoutes.pharmacies.ownedDocuments(pharmacyId);

  return parseApiResponseData(
    await localApiRequest(url, { method: 'POST', body: payload }),

    parsePharmacyProfileDocumentUploadResponse,

    { url, method: 'POST' }
  );
}

//===================================================================

export async function sendOwnedPharmacyForVerification(
  pharmacyId: string
): Promise<SendPharmacyForVerificationResponse> {
  const url = pharmacyApiRoutes.pharmacies.ownedVerification(pharmacyId);

  return parseApiResponseData(
    await localApiRequest(url, { method: 'POST', body: {} }),

    parseSendPharmacyForVerificationResponse,

    { url, method: 'POST' }
  );
}
