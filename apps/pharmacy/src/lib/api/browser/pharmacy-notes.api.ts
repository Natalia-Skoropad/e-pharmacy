import 'client-only';

import { buildQueryString, getResponseData } from '@e-pharmacy/api-client/core';

import {
  normalizePaginatedResponse,
  requirePaginatedResponse,
} from '@e-pharmacy/api-client/response';

import type { ApiSuccessResponse } from '@e-pharmacy/types';
import { isRecord } from '@e-pharmacy/utils/guards';
import { getTrimmedString } from '@e-pharmacy/utils/strings';
import { localApiRequest } from '@e-pharmacy/next-api/browser';
import type {
  EntityComment,
  EntityCommentsPage,
} from '@e-pharmacy/types/comments';

//===================================================================

export type PharmacyNoteEntityType =
  | 'client'
  | 'product'
  | 'pharmacy'
  | 'product_request';

//===================================================================

function normalizeComment(value: unknown): EntityComment | null {
  if (!isRecord(value)) return null;

  const id = getTrimmedString(value.id);
  const text = getTrimmedString(value.text);
  const createdAt = getTrimmedString(value.createdAt);

  return id && text && createdAt ? { id, text, createdAt } : null;
}

//===================================================================

export async function getPharmacyNotes(
  type: PharmacyNoteEntityType,
  entityId: string,
  page = 1
): Promise<EntityCommentsPage> {
  const response = await localApiRequest<ApiSuccessResponse<unknown>>(
    `/api/pharmacy-notes/${type}/${entityId}${buildQueryString({ page, perPage: 10 })}`
  );

  const pagination = requirePaginatedResponse(
    normalizePaginatedResponse(getResponseData(response), {
      normalizeItem: normalizeComment,
    }),
    'pharmacy notes response'
  );

  return {
    items: pagination.items,
    page: pagination.page,
    total: pagination.total,
    totalPages: pagination.totalPages,
  };
}

//===================================================================

export async function createPharmacyNote(
  type: PharmacyNoteEntityType,
  entityId: string,
  text: string
): Promise<void> {
  await localApiRequest(`/api/pharmacy-notes/${type}/${entityId}`, {
    method: 'POST',
    body: { text },
  });
}

//===================================================================

export async function deletePharmacyNote(
  type: PharmacyNoteEntityType,
  entityId: string,
  noteId: string
): Promise<void> {
  await localApiRequest(`/api/pharmacy-notes/${type}/${entityId}/${noteId}`, {
    method: 'DELETE',
  });
}
