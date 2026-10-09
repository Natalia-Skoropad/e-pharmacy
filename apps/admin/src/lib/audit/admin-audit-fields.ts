import type { AdminAuditValue } from './admin-audit';

//===================================================================

const FIELD_LABELS: Readonly<Record<string, string>> = {
  authorName: 'Comment author',
  createdAt: 'Creation date',
  createdByAdminUserId: 'Created by employee',
  ownerUserId: 'Pharmacy owner',
  hasPicture: 'Profile photo',
  exists: 'Record exists',
  text: 'Comment text',
  color: 'Category color',
  name: 'Name',
  size: 'File size',
  type: 'File type',
  status: 'Status',
  sortOrder: 'Display order',
  documentCount: 'Number of documents',
  documentMimeTypes: 'Document formats',
  documentSizesBytes: 'Document sizes (bytes)',
  registrationDocuments: 'Registration documents',
  totalDocumentSizeBytes: 'Total document size (bytes)',
  email: 'Email address',
  phone: 'Phone number',
  positionId: 'Position',
  authorUserId: 'Comment author',
};

//===================================================================

export function getAdminAuditFieldLabel(field: string): string {
  const known = FIELD_LABELS[field];
  if (known) return known;

  const words = field
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_.-]+/g, ' ')
    .replace(/\bids\b/gi, 'IDs')
    .replace(/\bid\b/gi, 'ID')
    .trim();

  return words ? words[0].toUpperCase() + words.slice(1) : field;
}

//===================================================================

export function getAdminAuditFieldsSummary(fields: readonly string[]): string {
  return fields.map(getAdminAuditFieldLabel).join(', ');
}

//===================================================================

export function getAuditColorSwatch(
  value: AdminAuditValue | undefined
): string | null {
  return typeof value === 'string' &&
    /^#[a-f0-9]{3}(?:[a-f0-9]{3})?(?:[a-f0-9]{2})?$/i.test(value)
    ? value
    : null;
}
