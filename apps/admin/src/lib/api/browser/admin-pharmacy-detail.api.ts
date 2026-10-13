import 'client-only';

import {
  parseApiResponseData,
  parseAdminPharmacyDetail,
  normalizeOrderSalesStatistics,
  type OrderSalesStatisticsQueryParams,
  parseAdminPharmacyDocumentsResponse,
  parseAdminPharmacyCommentsResponse,
  parseAdminPharmacyCommentResponse,
  parsePharmacyProfileResponse,
} from '@e-pharmacy/api-client/response';

import { appendQueryParams } from '@e-pharmacy/api-client/transport';
import { localApiRequest } from '@e-pharmacy/next-api/browser';

import type {
  AdminPharmacyDetail,
  AdminPharmacyDocumentsResponse,
  AdminPharmacyCommentsResponse,
  AdminPharmacyCommentResponse,
  CreateAdminPharmacyCommentPayload,
  AdminPharmacyModerationDecisionPayload,
  AdminPharmacyStatusPayload,
  AdminPharmacyCorrectionsPayload,
} from '@e-pharmacy/types/admin';

import type { PharmacyProfileResponse } from '@e-pharmacy/types/pharmacies';

import { adminApiRoutes as ROUTES } from '@/lib/api/routes/admin-api-routes';
import { assertAdminPharmacyId } from '@/lib/pharmacies/admin-pharmacy';

import {
  parseAdminAuditActorsResponse,
  parseAdminAuditListResponse,
  parseAdminAuditDetailsResponse,
  type AdminAuditQueryParams,
  type AdminAuditActorsResponse,
  type AdminAuditListResponse,
  type AdminAuditDetailsResponse,
} from '@/lib/audit/admin-audit';

//===================================================================

type Options = Readonly<{ signal?: AbortSignal }>;

type PharmacyActivityParams = Readonly<
  Pick<
    AdminAuditQueryParams,
    | 'page'
    | 'perPage'
    | 'dateFrom'
    | 'dateTo'
    | 'action'
    | 'section'
    | 'actorUserId'
    | 'actorType'
  >
>;

//===================================================================

function pharmacyId(raw: string): string {
  return assertAdminPharmacyId(raw);
}

//===================================================================

function entityId(raw: string, label: string): string {
  return assertAdminPharmacyId(raw, label);
}

//===================================================================

function checkedMutationKey(key: string): string {
  if (!/^[\w.-]{8,128}$/.test(key))
    throw new TypeError('Invalid clientRequestId.');

  return key;
}

//===================================================================

export async function getAdminPharmacyDetail(
  rawPharmacyId: string,
  options?: Options
): Promise<AdminPharmacyDetail> {
  const path = ROUTES.pharmacyDetail.details(pharmacyId(rawPharmacyId));

  return parseApiResponseData(
    await localApiRequest(path, { signal: options?.signal }),

    parseAdminPharmacyDetail,
    { url: path, method: 'GET' }
  );
}

//===================================================================

export async function getAdminPharmacySalesStatistics(
  rawPharmacyId: string,
  params: OrderSalesStatisticsQueryParams,
  options?: Options
) {
  const path = appendQueryParams(
    ROUTES.pharmacyDetail.salesStatistics(pharmacyId(rawPharmacyId)),
    params
  );

  return parseApiResponseData(
    await localApiRequest(path, { signal: options?.signal }),
    normalizeOrderSalesStatistics,
    { url: path, method: 'GET' }
  );
}

//===================================================================

export async function getAdminPharmacyDocuments(
  rawPharmacyId: string,
  options?: Options
): Promise<AdminPharmacyDocumentsResponse> {
  const path = ROUTES.pharmacyDocuments.list(pharmacyId(rawPharmacyId));

  return parseApiResponseData(
    await localApiRequest(path, { signal: options?.signal }),

    parseAdminPharmacyDocumentsResponse,
    { url: path, method: 'GET' }
  );
}

//===================================================================

export async function downloadAdminPharmacyDocument(
  rawPharmacyId: string,
  rawDocumentId: string,
  options?: Options
): Promise<Blob> {
  const path = ROUTES.pharmacyDocuments.download(
    pharmacyId(rawPharmacyId),
    entityId(rawDocumentId, 'document id')
  );

  return localApiRequest(path, {
    signal: options?.signal,
    responseType: 'blob',
  });
}

//===================================================================

export async function getAdminPharmacyComments(
  rawPharmacyId: string,
  options?: Options
): Promise<AdminPharmacyCommentsResponse> {
  const path = ROUTES.pharmacyComments.list(pharmacyId(rawPharmacyId));

  return parseApiResponseData(
    await localApiRequest(path, { signal: options?.signal }),

    parseAdminPharmacyCommentsResponse,
    { url: path, method: 'GET' }
  );
}

//===================================================================

export async function createAdminPharmacyComment(
  rawPharmacyId: string,
  payload: CreateAdminPharmacyCommentPayload,
  options?: Options
): Promise<AdminPharmacyCommentResponse> {
  checkedMutationKey(payload.clientRequestId);

  const path = ROUTES.pharmacyComments.list(pharmacyId(rawPharmacyId));

  return parseApiResponseData(
    await localApiRequest(path, {
      method: 'POST',
      body: payload,
      signal: options?.signal,
    }),

    parseAdminPharmacyCommentResponse,
    { url: path, method: 'POST' }
  );
}

//===================================================================

export async function deleteAdminPharmacyComment(
  rawPharmacyId: string,
  rawCommentId: string,
  options?: Options
): Promise<void> {
  const path = ROUTES.pharmacyComments.detail(
    pharmacyId(rawPharmacyId),
    entityId(rawCommentId, 'comment id')
  );

  await localApiRequest(path, {
    method: 'DELETE',
    signal: options?.signal,
    responseType: 'no-content',
  });
}

//===================================================================

export async function getAdminPharmacyActivity(
  rawPharmacyId: string,
  params: PharmacyActivityParams = {},
  options?: Options
): Promise<AdminAuditListResponse> {
  const path = appendQueryParams(
    ROUTES.pharmacyActivity.list(pharmacyId(rawPharmacyId)),
    params
  );

  return parseApiResponseData(
    await localApiRequest(path, { signal: options?.signal }),

    parseAdminAuditListResponse,
    { url: path, method: 'GET' }
  );
}

//===================================================================

export async function getAdminPharmacyActivityActors(
  rawPharmacyId: string,
  options?: Options
): Promise<AdminAuditActorsResponse> {
  const path = ROUTES.pharmacyActivity.actors(pharmacyId(rawPharmacyId));

  return parseApiResponseData(
    await localApiRequest(path, { signal: options?.signal }),

    parseAdminAuditActorsResponse,
    { url: path, method: 'GET' }
  );
}

//===================================================================

export async function getAdminPharmacyActivityDetail(
  rawPharmacyId: string,
  rawAuditLogId: string,
  options?: Options
): Promise<AdminAuditDetailsResponse> {
  const path = ROUTES.pharmacyActivity.details(
    pharmacyId(rawPharmacyId),
    entityId(rawAuditLogId, 'audit log id')
  );

  return parseApiResponseData(
    await localApiRequest(path, { signal: options?.signal }),

    parseAdminAuditDetailsResponse,
    { url: path, method: 'GET' }
  );
}

//===================================================================

async function moderationMutation(
  rawPharmacyId: string,
  resource: 'decision' | 'status' | 'corrections',

  body:
    | AdminPharmacyModerationDecisionPayload
    | AdminPharmacyStatusPayload
    | AdminPharmacyCorrectionsPayload,

  options?: Options
): Promise<PharmacyProfileResponse> {
  checkedMutationKey(body.clientRequestId);
  const id = pharmacyId(rawPharmacyId);
  const path = ROUTES.pharmacyDetail[resource](id);
  const method = resource === 'status' ? 'PATCH' : 'POST';

  return parseApiResponseData(
    await localApiRequest(path, { method, body, signal: options?.signal }),

    parsePharmacyProfileResponse,
    { url: path, method }
  );
}

//===================================================================

export function decideAdminPharmacyModeration(
  rawPharmacyId: string,
  payload: AdminPharmacyModerationDecisionPayload,
  options?: Options
) {
  return moderationMutation(rawPharmacyId, 'decision', payload, options);
}

//===================================================================

export function updateAdminPharmacyStatus(
  rawPharmacyId: string,
  payload: AdminPharmacyStatusPayload,
  options?: Options
) {
  return moderationMutation(rawPharmacyId, 'status', payload, options);
}

//===================================================================

export function requestAdminPharmacyCorrections(
  rawPharmacyId: string,
  payload: AdminPharmacyCorrectionsPayload,
  options?: Options
) {
  return moderationMutation(rawPharmacyId, 'corrections', payload, options);
}
