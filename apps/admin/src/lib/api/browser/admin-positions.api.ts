import 'client-only';

import { parseApiResponseData } from '@e-pharmacy/api-client/response';
import { appendQueryParams } from '@e-pharmacy/api-client/transport';
import { localApiRequest } from '@e-pharmacy/next-api/browser';

import type {
  CreatePositionPayload,
  PositionListResponse,
  UpdatePositionPayload,
} from '@e-pharmacy/types/reference-data';

import { adminApiRoutes as ADMIN_API_ROUTES } from '@/lib/api/routes/admin-api-routes';

import {
  parsePositionListResponse,
  parsePositionMutationResponse,
  type PositionMutationResponse,
  type SettingsDictionaryListQuery,
} from '@/lib/settings/settings-dictionary';

//===================================================================

export async function getAdminPositions(
  params: SettingsDictionaryListQuery = {},
  options?: Readonly<{ signal?: AbortSignal }>
): Promise<PositionListResponse> {
  const path = appendQueryParams(ADMIN_API_ROUTES.positions.list, params);

  return parseApiResponseData(
    await localApiRequest(path, { signal: options?.signal }),
    parsePositionListResponse,
    { url: path, method: 'GET' }
  );
}

//===================================================================

export async function createAdminPosition(
  payload: CreatePositionPayload,
  options?: Readonly<{ signal?: AbortSignal }>
): Promise<PositionMutationResponse> {
  const path = ADMIN_API_ROUTES.positions.list;

  return parseApiResponseData(
    await localApiRequest(path, {
      method: 'POST',
      body: payload,
      signal: options?.signal,
    }),

    parsePositionMutationResponse,
    { url: path, method: 'POST' }
  );
}

//===================================================================

export async function updateAdminPosition(
  positionId: string,
  payload: UpdatePositionPayload,
  options?: Readonly<{ signal?: AbortSignal }>
): Promise<PositionMutationResponse> {
  const path = ADMIN_API_ROUTES.positions.details(positionId);

  return parseApiResponseData(
    await localApiRequest(path, {
      method: 'PATCH',
      body: payload,
      signal: options?.signal,
    }),

    parsePositionMutationResponse,
    { url: path, method: 'PATCH' }
  );
}

//===================================================================

export async function deleteAdminPosition(
  positionId: string,
  options?: Readonly<{ signal?: AbortSignal }>
): Promise<void> {
  const path = ADMIN_API_ROUTES.positions.details(positionId);

  await localApiRequest(path, {
    method: 'DELETE',
    responseType: 'no-content',
    signal: options?.signal,
  });
}
