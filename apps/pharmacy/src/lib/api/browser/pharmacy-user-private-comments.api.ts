import 'client-only';

import { parseApiResponseData } from '@e-pharmacy/api-client/response';
import { appendQueryParams } from '@e-pharmacy/api-client/transport';
import { localApiRequest } from '@e-pharmacy/next-api/browser';

import type {
  CreatePharmacyUserPrivateNotePayload,
  PharmacyUserPrivateNoteResponse,
  PharmacyUserPrivateNotesResponse,
} from '@e-pharmacy/types/pharmacy-owners';

import type { EntityId } from '@e-pharmacy/types/primitives';

import { pharmacyApiRoutes as PHARMACY_API_ROUTES } from '@/lib/api/routes/pharmacy-api-routes';

import {
  parsePharmacyUserPrivateNoteResponse,
  parsePharmacyUserPrivateNotesResponse,
} from '@/lib/profile/pharmacy-user-private-notes';

//===================================================================

const PRIVATE_COMMENTS_PER_PAGE = 10;

//===================================================================

type RequestOptions = Readonly<{ signal?: AbortSignal }>;

//===================================================================

export async function getMyPharmacyUserPrivateComments(
  page = 1,
  options?: RequestOptions
): Promise<PharmacyUserPrivateNotesResponse> {
  const path = appendQueryParams(
    PHARMACY_API_ROUTES.pharmacyOwners.myComments,

    {
      page,
      perPage: PRIVATE_COMMENTS_PER_PAGE,
    }
  );

  return parseApiResponseData(
    await localApiRequest(path, { signal: options?.signal }),

    parsePharmacyUserPrivateNotesResponse,

    { url: path, method: 'GET' }
  );
}

//===================================================================

export async function createMyPharmacyUserPrivateComment(
  payload: CreatePharmacyUserPrivateNotePayload,
  options?: RequestOptions
): Promise<PharmacyUserPrivateNoteResponse> {
  const path = PHARMACY_API_ROUTES.pharmacyOwners.myComments;

  return parseApiResponseData(
    await localApiRequest(path, {
      method: 'POST',
      body: payload,
      signal: options?.signal,
    }),

    parsePharmacyUserPrivateNoteResponse,

    { url: path, method: 'POST' }
  );
}

//===================================================================

export async function deleteMyPharmacyUserPrivateComment(
  commentId: EntityId,
  options?: RequestOptions
): Promise<void> {
  await localApiRequest(
    PHARMACY_API_ROUTES.pharmacyOwners.myComment(commentId),

    {
      method: 'DELETE',
      responseType: 'no-content',
      signal: options?.signal,
    }
  );
}
