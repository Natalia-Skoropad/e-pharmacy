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

export async function cancelOwnedPharmacyReview(
  pharmacyId: string,
  type: 'verification' | 'moderation' | 'reactivation',
  expectedRevision: string
): Promise<PharmacyProfileResponse> {
  const url = pharmacyApiRoutes.pharmacies.ownedCancelReview(pharmacyId);

  return parseApiResponseData(
    await localApiRequest(url, {
      method: 'POST',
      body: { type, expectedRevision },
    }),

    parsePharmacyProfileResponse,
    { url, method: 'POST' }
  );
}

//===================================================================

export type LifecycleEvent = Readonly<{
  id: string;
  action: string;
  actor: string;
  createdAt: string;
  reason?: string;
  previousStatus: string | null;
  nextStatus: string | null;
  previousReviewState: string | null;
  nextReviewState: string | null;
}>;

//===================================================================

export async function getOwnedPharmacyLifecycleHistory(
  pharmacyId: string,
  page = 1
): Promise<{ items: LifecycleEvent[]; hasMore: boolean }> {
  const url = `${pharmacyApiRoutes.pharmacies.ownedLifecycleHistory(pharmacyId)}?page=${page}`;
  const response: unknown = await localApiRequest(url);

  const data = (
    response as { data?: { items?: LifecycleEvent[]; hasMore?: boolean } }
  )?.data;

  if (!data || !Array.isArray(data.items))
    throw new Error('Invalid lifecycle history response.');

  return { items: data.items, hasMore: data.hasMore === true };
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

//===================================================================

export type PharmacyPaymentDuplicates = Readonly<
  Partial<Record<'taxId' | 'iban' | 'receiptEmail', boolean>>
>;

//===================================================================

/** Preflight only; the transactional API is authoritative for uniqueness. */
export async function getOwnedPharmacyPaymentAvailability(
  pharmacyId: string | undefined,
  values: { taxId: string; iban: string; receiptEmail: string },
  signal?: AbortSignal
): Promise<PharmacyPaymentDuplicates> {
  const params = new URLSearchParams();

  for (const field of ['taxId', 'iban', 'receiptEmail'] as const) {
    if (values[field].trim()) params.set(field, values[field].trim());
  }

  const path = pharmacyId
    ? pharmacyApiRoutes.pharmacies.ownedPaymentAvailability(pharmacyId)
    : pharmacyApiRoutes.pharmacies.newPaymentAvailability;

  const url = `${path}?${params}`;
  const result: unknown = await localApiRequest(url, { signal });

  const data = (result as { data?: { duplicates?: unknown } })?.data
    ?.duplicates;

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('Could not verify payment details uniqueness.');
  }

  const duplicates = data as Record<string, unknown>;

  for (const field of ['taxId', 'iban', 'receiptEmail'] as const) {
    if (
      duplicates[field] !== undefined &&
      typeof duplicates[field] !== 'boolean'
    ) {
      throw new Error('Invalid payment availability response.');
    }
  }

  return data as PharmacyPaymentDuplicates;
}

//===================================================================

export async function deleteOwnedPharmacyDraft(
  pharmacyId: string,
  expectedRevision: string
): Promise<void> {
  const url = pharmacyApiRoutes.pharmacies.ownedDeleteDraft(pharmacyId);

  await localApiRequest(url, { method: 'DELETE', body: { expectedRevision } });
}

//===================================================================

export async function requestOwnedPharmacyReactivation(
  pharmacyId: string,
  payload: Readonly<{ expectedRevision: string; reason: string }>
): Promise<PharmacyProfileResponse> {
  const url = pharmacyApiRoutes.pharmacies.ownedRequestReactivation(pharmacyId);

  return parseApiResponseData(
    await localApiRequest(url, { method: 'POST', body: payload }),

    parsePharmacyProfileResponse,
    { url, method: 'POST' }
  );
}
