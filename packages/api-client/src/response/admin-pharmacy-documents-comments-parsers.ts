import type {
  AdminPharmacyComment,
  AdminPharmacyCommentResponse,
  AdminPharmacyCommentsResponse,
  AdminPharmacyDocument,
  AdminPharmacyDocumentsResponse,
} from '@e-pharmacy/types/admin';

//===================================================================

const OBJECT_ID = /^[0-9a-f]{24}$/i;

//===================================================================

function record(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`Invalid ${label}.`);
  }

  return value as Record<string, unknown>;
}

//===================================================================

function text(value: unknown, label: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new TypeError(`Invalid ${label}.`);
  }

  return value;
}

//===================================================================

function id(value: unknown, label: string): string {
  const result = text(value, label);

  if (!OBJECT_ID.test(result)) throw new TypeError(`Invalid ${label}.`);

  return result;
}

//===================================================================

function date(value: unknown, label: string): string {
  const result = text(value, label);
  const parsed = new Date(result);

  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString() !== result) {
    throw new TypeError(`Invalid ${label}.`);
  }

  return result;
}

//===================================================================

export function parseAdminPharmacyDocument(
  value: unknown
): AdminPharmacyDocument {
  const row = record(value, 'pharmacy document');

  if (!Number.isSafeInteger(row.size) || (row.size as number) < 0) {
    throw new TypeError('Invalid pharmacy document size.');
  }

  if (row.source !== 'published' && row.source !== 'pending') {
    throw new TypeError('Invalid pharmacy document source.');
  }

  return {
    id: id(row.id, 'pharmacy document id'),
    name: text(row.name, 'pharmacy document name'),
    size: row.size as number,
    type: text(row.type, 'pharmacy document type'),
    uploadedAt: date(row.uploadedAt, 'pharmacy document uploadedAt'),
    source: row.source,
  };
}

//===================================================================

export function parseAdminPharmacyDocumentsResponse(
  value: unknown
): AdminPharmacyDocumentsResponse {
  const row = record(value, 'pharmacy documents response');

  if (!Array.isArray(row.documents))
    throw new TypeError('Invalid pharmacy documents.');

  return { documents: row.documents.map(parseAdminPharmacyDocument) };
}

//===================================================================

export function parseAdminPharmacyComment(
  value: unknown
): AdminPharmacyComment {
  const row = record(value, 'pharmacy admin comment');
  const author = record(row.author, 'pharmacy admin comment author');
  const pictureUrl = author.pictureUrl;

  if (
    pictureUrl !== undefined &&
    (typeof pictureUrl !== 'string' || !pictureUrl.trim())
  ) {
    throw new TypeError('Invalid pharmacy admin comment pictureUrl.');
  }

  return {
    id: id(row.id, 'pharmacy comment id'),
    pharmacyId: id(row.pharmacyId, 'pharmacy comment pharmacyId'),
    text: text(row.text, 'pharmacy comment text'),
    createdAt: date(row.createdAt, 'pharmacy comment createdAt'),

    author: {
      userId: id(author.userId, 'pharmacy comment author userId'),
      displayName: text(
        author.displayName,
        'pharmacy comment author displayName'
      ),

      ...(typeof pictureUrl === 'string' ? { pictureUrl } : {}),
    },
  };
}

//===================================================================

export function parseAdminPharmacyCommentsResponse(
  value: unknown
): AdminPharmacyCommentsResponse {
  const row = record(value, 'pharmacy comments response');

  if (!Array.isArray(row.comments))
    throw new TypeError('Invalid pharmacy comments.');

  return { comments: row.comments.map(parseAdminPharmacyComment) };
}

//===================================================================

export function parseAdminPharmacyCommentResponse(
  value: unknown
): AdminPharmacyCommentResponse {
  const row = record(value, 'pharmacy comment response');

  return { comment: parseAdminPharmacyComment(row.comment) };
}
