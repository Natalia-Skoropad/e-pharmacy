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
  SubmitMyPharmacyModerationPayload,
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
  pharmacyId: string,
  comment: string
): Promise<SendPharmacyForVerificationResponse> {
  const url = pharmacyApiRoutes.pharmacies.ownedVerification(pharmacyId);

  return parseApiResponseData(
    await localApiRequest(url, { method: 'POST', body: { comment } }),

    parseSendPharmacyForVerificationResponse,

    { url, method: 'POST' }
  );
}

//===================================================================

/** Submit saved pending edits for moderation of the selected pharmacy only. */
export async function submitOwnedPharmacyModeration(
  pharmacyId: string,
  payload: SubmitMyPharmacyModerationPayload & { comment: string }
): Promise<PharmacyProfileResponse> {
  const url = pharmacyApiRoutes.pharmacies.ownedModeration(pharmacyId);

  return parseApiResponseData(
    await localApiRequest(url, { method: 'POST', body: payload }),

    parsePharmacyProfileResponse,
    { url, method: 'POST' }
  );
}

//===================================================================

export async function getOwnedPharmacyDeactivationEligibility(
  pharmacyId: string,
  options?: Readonly<{ signal?: AbortSignal }>
): Promise<{
  canDeactivate: boolean;
  activeOrders: number;
  activeProductRequests: number;
  reason: string;
}> {
  const url =
    pharmacyApiRoutes.pharmacies.ownedDeactivationEligibility(pharmacyId);

  const response: unknown = await localApiRequest(url, {
    signal: options?.signal,
  });

  // Validate the public shape; the action must remain disabled on malformed data.
  const raw = response as { data?: Record<string, unknown> };

  const result = raw?.data;

  if (
    !result ||
    typeof result.canDeactivate !== 'boolean' ||
    typeof result.activeOrders !== 'number' ||
    typeof result.activeProductRequests !== 'number' ||
    typeof result.reason !== 'string'
  ) {
    throw new Error('Invalid pharmacy deactivation eligibility response.');
  }

  return {
    canDeactivate: result.canDeactivate,
    activeOrders: result.activeOrders,
    activeProductRequests: result.activeProductRequests,
    reason: result.reason,
  };
}

//===================================================================

export async function discardOwnedPharmacyPendingSection(
  pharmacyId: string,

  payload: Readonly<{
    section: 'data' | 'about' | 'payment' | 'documents';
    field: string;
    expectedRevision: string;
  }>
): Promise<PharmacyProfileResponse> {
  const url = pharmacyApiRoutes.pharmacies.ownedPendingChanges(pharmacyId);

  return parseApiResponseData(
    await localApiRequest(url, { method: 'DELETE', body: payload }),

    parsePharmacyProfileResponse,
    { url, method: 'DELETE' }
  );
}

//===================================================================

/** Deactivation is owned, audited and blocked when any order or product request is unfinished. */
export async function deactivateOwnedPharmacy(
  pharmacyId: string,
  payload: Readonly<{ reason: string; expectedRevision: string }>
): Promise<PharmacyProfileResponse> {
  const url = pharmacyApiRoutes.pharmacies.ownedDeactivation(pharmacyId);

  return parseApiResponseData(
    await localApiRequest(url, { method: 'POST', body: payload }),

    parsePharmacyProfileResponse,
    { url, method: 'POST' }
  );
}

//===================================================================

/** Private, pharmacy-scoped download; never select a default pharmacy. */
export async function downloadOwnedPharmacyDocument(
  pharmacyId: string,
  documentId: string,
  options?: Readonly<{ signal?: AbortSignal }>
): Promise<Blob> {
  return localApiRequest(
    pharmacyApiRoutes.pharmacies.ownedDocument(pharmacyId, documentId),

    { responseType: 'blob', signal: options?.signal }
  );
}
