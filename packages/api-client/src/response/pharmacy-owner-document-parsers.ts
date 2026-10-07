import type { ISODateTimeString } from '@e-pharmacy/types/primitives';

import type {
  PharmacyOwnerDocument,
  PharmacyOwnerDocumentResponse,
  PharmacyOwnerDocumentsResponse,
} from '@e-pharmacy/types/pharmacy-owners';

//===================================================================

function requireRecord(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object.`);
  }

  return value as Record<string, unknown>;
}

//===================================================================

function requireString(value: unknown, label: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new TypeError(`${label} must be a non-empty string.`);
  }

  return value;
}

//===================================================================

function requireNonNegativeInteger(value: unknown, label: string): number {
  if (!Number.isInteger(value) || (value as number) < 0) {
    throw new TypeError(`${label} must be a non-negative integer.`);
  }

  return value as number;
}

//===================================================================

function requireIsoDateTime(value: unknown, label: string): ISODateTimeString {
  const normalized = requireString(value, label);

  if (Number.isNaN(Date.parse(normalized))) {
    throw new TypeError(`${label} must be an ISO date-time string.`);
  }

  return normalized as ISODateTimeString;
}

//===================================================================

export function parsePharmacyOwnerDocument(
  value: unknown
): PharmacyOwnerDocument {
  const record = requireRecord(value, 'pharmacy owner document');

  return {
    id: requireString(record.id, 'pharmacy owner document id'),
    name: requireString(record.name, 'pharmacy owner document name'),

    size: requireNonNegativeInteger(
      record.size,
      'pharmacy owner document size'
    ),

    type: requireString(record.type, 'pharmacy owner document MIME type'),

    uploadedAt: requireIsoDateTime(
      record.uploadedAt,
      'pharmacy owner document uploadedAt'
    ),

    updatedAt: requireIsoDateTime(
      record.updatedAt,
      'pharmacy owner document updatedAt'
    ),
  };
}

//===================================================================

export function parsePharmacyOwnerDocumentsResponse(
  value: unknown
): PharmacyOwnerDocumentsResponse {
  const record = requireRecord(value, 'pharmacy owner documents response');

  if (!Array.isArray(record.documents)) {
    throw new TypeError('pharmacy owner documents must be an array.');
  }

  return {
    documents: record.documents.map(parsePharmacyOwnerDocument),
  };
}

//===================================================================

export function parsePharmacyOwnerDocumentResponse(
  value: unknown
): PharmacyOwnerDocumentResponse {
  const record = requireRecord(value, 'pharmacy owner document response');

  return {
    document: parsePharmacyOwnerDocument(record.document),
  };
}
