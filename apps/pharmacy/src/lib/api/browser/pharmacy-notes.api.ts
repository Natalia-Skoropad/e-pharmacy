import 'client-only';

import {
  appendQueryParams,
  getResponseData,
  type JsonResponseRequestOptions,
} from '@e-pharmacy/api-client/core';

import {
  normalizePaginatedResponse,
  requirePaginatedResponse,
} from '@e-pharmacy/api-client/response';

import type { ApiSuccessResponse } from '@e-pharmacy/types/api';
import { isRecord } from '@e-pharmacy/utils/guards';
import { getTrimmedString } from '@e-pharmacy/utils/strings';
import { isISODateTimeString } from '@e-pharmacy/validation/dates';
import { localApiRequest } from '@e-pharmacy/next-api/browser';

import { pharmacyApiRoutes as PHARMACY_API_ROUTES } from '@/lib/api/routes/pharmacy-api-routes';

import type {
  PharmacyNote,
  PharmacyNoteEntityType,
  PharmacyNotesResponse,
} from '@e-pharmacy/types/notes';

//===================================================================

function normalizeComment(value: unknown): PharmacyNote | null {
  if (!isRecord(value)) return null;

  const id = getTrimmedString(value.id);
  const text = getTrimmedString(value.text);
  const createdAt = getTrimmedString(value.createdAt);

  return id && text && isISODateTimeString(createdAt)
    ? { id, text, createdAt }
    : null;
}

//===================================================================

export async function getPharmacyNotes(
  type: PharmacyNoteEntityType,
  entityId: string,
  page = 1,
  options?: JsonResponseRequestOptions
): Promise<PharmacyNotesResponse> {
  const path = appendQueryParams(
    PHARMACY_API_ROUTES.pharmacyNotes.list(type, entityId),
    { page, perPage: 10 }
  );
  const response = await localApiRequest<ApiSuccessResponse<unknown>>(
    path,
    options
  );

  const pagination = requirePaginatedResponse(
    normalizePaginatedResponse(getResponseData(response), {
      legacyEmptyPage: 'normalize-to-zero',
      normalizeItem: normalizeComment,
    }),
    {
      label: 'pharmacy notes response',
      url: path,
      method: 'GET',
    }
  );

  return pagination;
}

//===================================================================

export async function createPharmacyNote(
  type: PharmacyNoteEntityType,
  entityId: string,
  text: string
): Promise<void> {
  await localApiRequest(PHARMACY_API_ROUTES.pharmacyNotes.list(type, entityId), {
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
  await localApiRequest(
    PHARMACY_API_ROUTES.pharmacyNotes.details(type, entityId, noteId),
    {
      method: 'DELETE',
    }
  );
}
