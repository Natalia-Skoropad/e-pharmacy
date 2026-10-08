import 'client-only';

import {
  parseApiResponseData,
  parsePharmacyOwnerDocumentsResponse,
} from '@e-pharmacy/api-client/response';

import { appendQueryParams } from '@e-pharmacy/api-client/transport';
import { localApiRequest } from '@e-pharmacy/next-api/browser';

import type {
  AdminPharmacyOwnerCommentResponse,
  AdminPharmacyOwnerCommentsResponse,
  AdminPharmacyOwnerDetail,
  AdminPharmacyOwnerListResponse,
  AdminPharmacyOwnerOptionsResponse,
  AdminPharmacyOwnerPharmaciesResponse,
  AdminPharmacyOwnerStatistics,
  AdminPharmacyOwnerStatusMutationResponse,
  CreateAdminPharmacyOwnerCommentPayload,
  UpdateAdminPharmacyOwnerStatusPayload,
} from '@e-pharmacy/types/admin';

import type { PharmacyOwnerDocumentsResponse } from '@e-pharmacy/types/pharmacy-owners';

import { adminApiRoutes as ADMIN_API_ROUTES } from '@/lib/api/routes/admin-api-routes';

import {
  parseAdminAuditListResponse,
  type AdminAuditQueryParams,
  type AdminAuditListResponse,
} from '@/lib/audit/admin-audit';

import {
  assertAdminPharmacyOwnerEntityId,
  parseAdminPharmacyOwnerCommentResponse,
  parseAdminPharmacyOwnerCommentsResponse,
  parseAdminPharmacyOwnerDetail,
  parseAdminPharmacyOwnerListResponse,
  parseAdminPharmacyOwnerOptionsResponse,
  parseAdminPharmacyOwnerPharmaciesResponse,
  parseAdminPharmacyOwnerStatistics,
  parseAdminPharmacyOwnerStatusMutationResponse,
  type AdminOwnerPharmacyStatus,
  type AdminOwnerRatingFilter,
  type AdminPharmacyOwnerStatus,
} from '@/lib/pharmacy-owners/admin-pharmacy-owner';

//===================================================================

export type AdminPharmacyOwnerListQueryParams = Readonly<{
  search?: string;
  status?: AdminPharmacyOwnerStatus;
  registeredFrom?: string;
  registeredTo?: string;
  page?: number;
  perPage?: 20 | 50 | 100;
}>;

export type AdminPharmacyOwnerOptionsQueryParams = Readonly<{
  search?: string;
  limit?: number;
}>;

export type AdminPharmacyOwnerPharmaciesQueryParams = Readonly<{
  search?: string;
  status?: AdminOwnerPharmacyStatus;
  createdFrom?: string;
  createdTo?: string;
  rating?: AdminOwnerRatingFilter;
  page?: number;
  perPage?: 20 | 50 | 100;
}>;

export type AdminPharmacyOwnerActivityQueryParams = Readonly<
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

function ownerId(value: string): string {
  return assertAdminPharmacyOwnerEntityId(value, 'owner id');
}

//===================================================================

function nestedId(value: string, label: string): string {
  return assertAdminPharmacyOwnerEntityId(value, label);
}

//===================================================================

export async function getAdminPharmacyOwners(
  params: AdminPharmacyOwnerListQueryParams = {},
  options?: Readonly<{ signal?: AbortSignal }>
): Promise<AdminPharmacyOwnerListResponse> {
  const path = appendQueryParams(ADMIN_API_ROUTES.pharmacyOwners.list, params);

  return parseApiResponseData(
    await localApiRequest(path, { signal: options?.signal }),
    parseAdminPharmacyOwnerListResponse,
    { url: path, method: 'GET' }
  );
}

//===================================================================

export async function getAdminPharmacyOwnerSummary(
  options?: Readonly<{ signal?: AbortSignal }>
): Promise<AdminPharmacyOwnerStatistics> {
  const path = ADMIN_API_ROUTES.pharmacyOwners.summary;

  return parseApiResponseData(
    await localApiRequest(path, { signal: options?.signal }),
    parseAdminPharmacyOwnerStatistics,
    { url: path, method: 'GET' }
  );
}

//===================================================================

export async function getAdminPharmacyOwnerOptions(
  params: AdminPharmacyOwnerOptionsQueryParams = {},
  options?: Readonly<{ signal?: AbortSignal }>
): Promise<AdminPharmacyOwnerOptionsResponse> {
  const path = appendQueryParams(
    ADMIN_API_ROUTES.pharmacyOwners.options,
    params
  );

  return parseApiResponseData(
    await localApiRequest(path, { signal: options?.signal }),
    parseAdminPharmacyOwnerOptionsResponse,
    { url: path, method: 'GET' }
  );
}

//===================================================================

export async function getAdminPharmacyOwnerDetail(
  rawOwnerId: string,
  options?: Readonly<{ signal?: AbortSignal }>
): Promise<AdminPharmacyOwnerDetail> {
  const path = ADMIN_API_ROUTES.pharmacyOwners.details(ownerId(rawOwnerId));

  return parseApiResponseData(
    await localApiRequest(path, { signal: options?.signal }),
    parseAdminPharmacyOwnerDetail,
    { url: path, method: 'GET' }
  );
}

//===================================================================

export async function updateAdminPharmacyOwnerStatus(
  rawOwnerId: string,
  payload: UpdateAdminPharmacyOwnerStatusPayload,
  options?: Readonly<{ signal?: AbortSignal }>
): Promise<AdminPharmacyOwnerStatusMutationResponse> {
  const path = ADMIN_API_ROUTES.pharmacyOwners.status(ownerId(rawOwnerId));

  return parseApiResponseData(
    await localApiRequest(path, {
      method: 'PATCH',
      body: payload,
      signal: options?.signal,
    }),
    parseAdminPharmacyOwnerStatusMutationResponse,
    { url: path, method: 'PATCH' }
  );
}

//===================================================================

export async function getAdminPharmacyOwnerPharmacies(
  rawOwnerId: string,
  params: AdminPharmacyOwnerPharmaciesQueryParams = {},
  options?: Readonly<{ signal?: AbortSignal }>
): Promise<AdminPharmacyOwnerPharmaciesResponse> {
  const base = ADMIN_API_ROUTES.pharmacyOwners.pharmacies(ownerId(rawOwnerId));
  const path = appendQueryParams(base, params);

  return parseApiResponseData(
    await localApiRequest(path, { signal: options?.signal }),
    parseAdminPharmacyOwnerPharmaciesResponse,
    { url: path, method: 'GET' }
  );
}

//===================================================================

export async function getAdminPharmacyOwnerDocuments(
  rawOwnerId: string,
  options?: Readonly<{ signal?: AbortSignal }>
): Promise<PharmacyOwnerDocumentsResponse> {
  const path = ADMIN_API_ROUTES.pharmacyOwners.documents(ownerId(rawOwnerId));

  return parseApiResponseData(
    await localApiRequest(path, { signal: options?.signal }),
    parsePharmacyOwnerDocumentsResponse,
    { url: path, method: 'GET' }
  );
}

//===================================================================

export async function downloadAdminPharmacyOwnerDocument(
  rawOwnerId: string,
  rawDocumentId: string,
  options?: Readonly<{ signal?: AbortSignal }>
): Promise<Blob> {
  const path = ADMIN_API_ROUTES.pharmacyOwners.document(
    ownerId(rawOwnerId),
    nestedId(rawDocumentId, 'document id')
  );

  return localApiRequest(path, {
    responseType: 'blob',
    signal: options?.signal,
  });
}

//===================================================================

export async function getAdminPharmacyOwnerComments(
  rawOwnerId: string,
  options?: Readonly<{ signal?: AbortSignal }>
): Promise<AdminPharmacyOwnerCommentsResponse> {
  const path = ADMIN_API_ROUTES.pharmacyOwners.comments(ownerId(rawOwnerId));

  return parseApiResponseData(
    await localApiRequest(path, { signal: options?.signal }),
    parseAdminPharmacyOwnerCommentsResponse,
    { url: path, method: 'GET' }
  );
}

//===================================================================

export async function createAdminPharmacyOwnerComment(
  rawOwnerId: string,
  payload: CreateAdminPharmacyOwnerCommentPayload,
  options?: Readonly<{ signal?: AbortSignal }>
): Promise<AdminPharmacyOwnerCommentResponse> {
  const path = ADMIN_API_ROUTES.pharmacyOwners.comments(ownerId(rawOwnerId));

  return parseApiResponseData(
    await localApiRequest(path, {
      method: 'POST',
      body: payload,
      signal: options?.signal,
    }),

    parseAdminPharmacyOwnerCommentResponse,
    { url: path, method: 'POST' }
  );
}

//===================================================================

export async function deleteAdminPharmacyOwnerComment(
  rawOwnerId: string,
  rawCommentId: string,
  options?: Readonly<{ signal?: AbortSignal }>
): Promise<void> {
  const path = ADMIN_API_ROUTES.pharmacyOwners.comment(
    ownerId(rawOwnerId),
    nestedId(rawCommentId, 'comment id')
  );

  await localApiRequest(path, {
    method: 'DELETE',
    responseType: 'no-content',
    signal: options?.signal,
  });
}

//===================================================================

export async function getAdminPharmacyOwnerActivity(
  rawOwnerId: string,
  params: AdminPharmacyOwnerActivityQueryParams = {},
  options?: Readonly<{ signal?: AbortSignal }>
): Promise<AdminAuditListResponse> {
  const base = ADMIN_API_ROUTES.pharmacyOwners.activity(ownerId(rawOwnerId));
  const path = appendQueryParams(base, params);

  return parseApiResponseData(
    await localApiRequest(path, { signal: options?.signal }),
    parseAdminAuditListResponse,
    { url: path, method: 'GET' }
  );
}
