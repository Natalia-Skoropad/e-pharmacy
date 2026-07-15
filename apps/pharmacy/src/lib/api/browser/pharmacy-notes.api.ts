import 'client-only';

import { buildQueryString, getResponseData } from '@e-pharmacy/api-client/core';
import type { ApiSuccessResponse } from '@e-pharmacy/types';
import { localApiRequest } from '@e-pharmacy/next-api/browser';

import type {
  EntityComment,
  EntityCommentsPage,
} from '@e-pharmacy/ui/feedback';

//===================================================================

export type PharmacyNoteEntityType = 'client' | 'product';

//===================================================================

function normalizeComment(value: unknown): EntityComment | null {
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  return typeof record.id === 'string' &&
    typeof record.text === 'string' &&
    typeof record.createdAt === 'string'
    ? { id: record.id, text: record.text, createdAt: record.createdAt }
    : null;
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
  const data = getResponseData(response) as Record<string, unknown>;
  return {
    items: Array.isArray(data.items)
      ? data.items
          .map(normalizeComment)
          .filter((item): item is EntityComment => Boolean(item))
      : [],
    page: typeof data.page === 'number' ? data.page : page,
    total: typeof data.total === 'number' ? data.total : 0,
    totalPages: typeof data.totalPages === 'number' ? data.totalPages : 1,
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
