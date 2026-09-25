import 'client-only';

import {
  parseApiEmptyResponse,
  parseApiResponseData,
} from '@e-pharmacy/api-client/response';

import { appendQueryParams } from '@e-pharmacy/api-client/transport';
import { localApiRequest } from '@e-pharmacy/next-api/browser';

import type {
  AdminEmployeePrivateNoteResponse,
  AdminEmployeePrivateNotesResponse,
  CreateAdminEmployeePrivateNotePayload,
} from '@e-pharmacy/types/admin';

import type { EntityId } from '@e-pharmacy/types/primitives';

import { adminApiRoutes as ADMIN_API_ROUTES } from '@/lib/api/routes/admin-api-routes';

import {
  parseAdminEmployeePrivateNoteResponse,
  parseAdminEmployeePrivateNotesResponse,
} from '@/lib/profile/admin-employee-private-notes';

//===================================================================

const ADMIN_PRIVATE_COMMENTS_PER_PAGE = 10;

type RequestOptions = Readonly<{ signal?: AbortSignal }>;

//===================================================================

export async function getMyAdminPrivateComments(
  page = 1,
  options?: RequestOptions
): Promise<AdminEmployeePrivateNotesResponse> {
  const path = appendQueryParams(ADMIN_API_ROUTES.adminEmployees.myComments, {
    page,
    perPage: ADMIN_PRIVATE_COMMENTS_PER_PAGE,
  });

  return parseApiResponseData(
    await localApiRequest(path, { signal: options?.signal }),
    parseAdminEmployeePrivateNotesResponse,
    { url: path, method: 'GET' }
  );
}

//===================================================================

export async function createMyAdminPrivateComment(
  payload: CreateAdminEmployeePrivateNotePayload,
  options?: RequestOptions
): Promise<AdminEmployeePrivateNoteResponse> {
  const path = ADMIN_API_ROUTES.adminEmployees.myComments;

  return parseApiResponseData(
    await localApiRequest(path, {
      method: 'POST',
      body: payload,
      signal: options?.signal,
    }),
    parseAdminEmployeePrivateNoteResponse,
    { url: path, method: 'POST' }
  );
}

//===================================================================

export async function deleteMyAdminPrivateComment(
  commentId: EntityId,
  options?: RequestOptions
): Promise<void> {
  const path = ADMIN_API_ROUTES.adminEmployees.myComment(commentId);

  parseApiEmptyResponse(
    await localApiRequest(path, {
      method: 'DELETE',
      signal: options?.signal,
    }),
    { url: path, method: 'DELETE' }
  );
}
