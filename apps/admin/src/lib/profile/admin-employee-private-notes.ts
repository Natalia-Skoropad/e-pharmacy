import type {
  AdminEmployeePrivateNote,
  AdminEmployeePrivateNoteResponse,
  AdminEmployeePrivateNotesResponse,
} from '@e-pharmacy/types/admin';

import type { ISODateTimeString } from '@e-pharmacy/types/primitives';
import { isISODateTimeString } from '@e-pharmacy/validation/dates';

//===================================================================

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

//===================================================================

function parseIsoDateTime(value: unknown): ISODateTimeString {
  if (!isISODateTimeString(value)) {
    throw new TypeError('Invalid private comment createdAt.');
  }

  return value;
}

//===================================================================

function parseNonEmptyString(value: unknown, label: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new TypeError(`Invalid private comment ${label}.`);
  }

  return value;
}

//===================================================================

export function parseAdminEmployeePrivateNote(
  value: unknown
): AdminEmployeePrivateNote {
  if (!isRecord(value) || !isRecord(value.author)) {
    throw new TypeError('Invalid admin private comment.');
  }

  return {
    id: parseNonEmptyString(value.id, 'id'),
    text: parseNonEmptyString(value.text, 'text'),
    createdAt: parseIsoDateTime(value.createdAt),
    author: {
      userId: parseNonEmptyString(value.author.userId, 'author userId'),
      displayName: parseNonEmptyString(
        value.author.displayName,
        'author displayName'
      ),
    },
  };
}

//===================================================================

function parsePaginationInteger(
  value: unknown,
  label: string,
  minimum: number
): number {
  if (!Number.isInteger(value) || (value as number) < minimum) {
    throw new TypeError(`Invalid private comments ${label}.`);
  }

  return value as number;
}

//===================================================================

export function parseAdminEmployeePrivateNotesResponse(
  value: unknown
): AdminEmployeePrivateNotesResponse {
  if (!isRecord(value) || !Array.isArray(value.items)) {
    throw new TypeError('Invalid admin private comments response.');
  }

  return {
    items: value.items.map(parseAdminEmployeePrivateNote),
    page: parsePaginationInteger(value.page, 'page', 1),
    perPage: parsePaginationInteger(value.perPage, 'perPage', 1),
    total: parsePaginationInteger(value.total, 'total', 0),
    totalPages: parsePaginationInteger(value.totalPages, 'totalPages', 0),
  };
}

//===================================================================

export function parseAdminEmployeePrivateNoteResponse(
  value: unknown
): AdminEmployeePrivateNoteResponse {
  if (!isRecord(value)) {
    throw new TypeError('Invalid admin private comment response.');
  }

  return {
    note: parseAdminEmployeePrivateNote(value.note),
  };
}
