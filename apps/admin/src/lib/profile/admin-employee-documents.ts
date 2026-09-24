import type {
  AdminEmployeeDocument,
  AdminEmployeeDocumentResponse,
  AdminEmployeeDocumentsResponse,
} from '@e-pharmacy/types/admin';

import type { ISODateTimeString } from '@e-pharmacy/types/primitives';
import { isISODateTimeString } from '@e-pharmacy/validation/dates';

//===================================================================

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

//===================================================================

function parseIsoDateTime(value: unknown, label: string): ISODateTimeString {
  if (!isISODateTimeString(value)) {
    throw new TypeError(`Invalid ${label}.`);
  }

  return value;
}

//===================================================================

export function parseAdminEmployeeDocument(
  value: unknown
): AdminEmployeeDocument {
  if (
    !isRecord(value) ||
    typeof value.id !== 'string' ||
    typeof value.name !== 'string' ||
    typeof value.size !== 'number' ||
    !Number.isInteger(value.size) ||
    value.size <= 0 ||
    typeof value.type !== 'string'
  ) {
    throw new TypeError('Invalid admin document.');
  }

  return {
    id: value.id,
    name: value.name,
    size: value.size,
    type: value.type,
    uploadedAt: parseIsoDateTime(value.uploadedAt, 'uploadedAt'),
    updatedAt: parseIsoDateTime(value.updatedAt, 'updatedAt'),
  };
}

//===================================================================

export function parseAdminEmployeeDocumentsResponse(
  value: unknown
): AdminEmployeeDocumentsResponse {
  if (!isRecord(value) || !Array.isArray(value.documents)) {
    throw new TypeError('Invalid admin documents response.');
  }

  return {
    documents: value.documents.map(parseAdminEmployeeDocument),
  };
}

//===================================================================

export function parseAdminEmployeeDocumentResponse(
  value: unknown
): AdminEmployeeDocumentResponse {
  if (!isRecord(value)) {
    throw new TypeError('Invalid admin document response.');
  }

  return {
    document: parseAdminEmployeeDocument(value.document),
  };
}
