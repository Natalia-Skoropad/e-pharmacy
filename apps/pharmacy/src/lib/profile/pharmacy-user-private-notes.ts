import type {
  PharmacyUserPrivateNote,
  PharmacyUserPrivateNoteResponse,
  PharmacyUserPrivateNotesResponse,
} from '@e-pharmacy/types/pharmacy-owners';

import type { ISODateTimeString } from '@e-pharmacy/types/primitives';
import { isISODateTimeString } from '@e-pharmacy/validation/dates';

//===================================================================

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

//===================================================================

function nonEmpty(value: unknown, label: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new TypeError(`Invalid private comment ${label}.`);
  }

  return value;
}

//===================================================================

function count(value: unknown, label: string, minimum: number): number {
  if (!Number.isInteger(value) || (value as number) < minimum) {
    throw new TypeError(`Invalid private comments ${label}.`);
  }

  return value as number;
}

//===================================================================

export function parsePharmacyUserPrivateNote(
  value: unknown
): PharmacyUserPrivateNote {
  if (!isRecord(value) || !isRecord(value.author)) {
    throw new TypeError('Invalid private comment.');
  }

  if (!isISODateTimeString(value.createdAt)) {
    throw new TypeError('Invalid private comment createdAt.');
  }

  return {
    id: nonEmpty(value.id, 'id'),
    text: nonEmpty(value.text, 'text'),
    createdAt: value.createdAt as ISODateTimeString,

    author: {
      userId: nonEmpty(value.author.userId, 'author userId'),
      displayName: nonEmpty(value.author.displayName, 'author displayName'),

      ...(typeof value.author.pictureUrl === 'string' &&
      value.author.pictureUrl.trim()
        ? { pictureUrl: value.author.pictureUrl.trim() }
        : {}),
    },
  };
}

//===================================================================

export function parsePharmacyUserPrivateNotesResponse(
  value: unknown
): PharmacyUserPrivateNotesResponse {
  if (!isRecord(value) || !Array.isArray(value.items)) {
    throw new TypeError('Invalid private comments response.');
  }

  return {
    items: value.items.map(parsePharmacyUserPrivateNote),
    page: count(value.page, 'page', 1),
    perPage: count(value.perPage, 'perPage', 1),
    total: count(value.total, 'total', 0),
    totalPages: count(value.totalPages, 'totalPages', 0),
  };
}

//===================================================================

export function parsePharmacyUserPrivateNoteResponse(
  value: unknown
): PharmacyUserPrivateNoteResponse {
  if (!isRecord(value)) {
    throw new TypeError('Invalid private comment response.');
  }

  return { note: parsePharmacyUserPrivateNote(value.note) };
}
