import 'client-only';

import {
  ApiError,
  appendQueryParams,
  type JsonResponseRequestOptions,
} from '@e-pharmacy/api-client/transport';

import {
  normalizePaginatedResponse,
  parseApiResponseData,
  parseMessageResponse,
  requirePaginatedResponse,
  type ApiResponseContext,
} from '@e-pharmacy/api-client/response';

import { localApiRequest } from '@e-pharmacy/next-api/browser';
import { isRecord } from '@e-pharmacy/utils/guards';
import { getTrimmedString } from '@e-pharmacy/utils/strings';
import { isISODateTimeString } from '@e-pharmacy/validation/dates';

import type {
  PharmacyNote,
  PharmacyNoteEntityType,
  PharmacyNotesResponse,
} from '@e-pharmacy/types/notes';

import { pharmacyApiRoutes as PHARMACY_API_ROUTES } from '@/lib/api/routes/pharmacy-api-routes';

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

function parseCreatedNote(
  value: unknown,
  context?: ApiResponseContext
): PharmacyNote {
  const note = normalizeComment(
    isRecord(value) && 'note' in value ? value.note : value
  );

  if (!note) {
    throw new ApiError('Created pharmacy note response is invalid.', {
      transportCode: 'INVALID_RESPONSE',
      payload: value,
      ...context,
    });
  }
  return note;
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

  return parseApiResponseData(
    await localApiRequest(path, options),
    (value) =>
      requirePaginatedResponse(
        normalizePaginatedResponse(value, {
          legacyEmptyPage: 'normalize-to-zero',
          normalizeItem: normalizeComment,
        }),
        { label: 'pharmacy notes response', url: path, method: 'GET' }
      ),
    { url: path, method: 'GET' }
  );
}

//===================================================================

export async function createPharmacyNote(
  type: PharmacyNoteEntityType,
  entityId: string,
  text: string
): Promise<void> {
  const path = PHARMACY_API_ROUTES.pharmacyNotes.list(type, entityId);

  parseApiResponseData(
    await localApiRequest(path, { method: 'POST', body: { text } }),
    parseCreatedNote,
    { url: path, method: 'POST' }
  );
}

//===================================================================

export async function deletePharmacyNote(
  type: PharmacyNoteEntityType,
  entityId: string,
  noteId: string
): Promise<void> {
  const path = PHARMACY_API_ROUTES.pharmacyNotes.details(
    type,
    entityId,
    noteId
  );

  parseApiResponseData(
    await localApiRequest(path, { method: 'DELETE' }),
    parseMessageResponse,
    { url: path, method: 'DELETE' }
  );
}
