import type { AdminAuditValue } from './admin-audit';

//===================================================================

const FIELD_LABELS: Readonly<Record<string, string>> = {
  event: 'Audit event',
  revision: 'Technical revision (legacy record)',
  editedSections: 'Edited sections (legacy record)',
  photoFingerprint: 'Pharmacy photo',
  documentList: 'Pharmacy documents',
  reviewState: 'Review status',
  reviewFeedback: 'Administrator feedback',
  blockSource: 'Blocking source',
  statusReason: 'Status reason',
  'location.address': 'Pharmacy address (Pharmacy data)',
  'location.settlement': 'Settlement (Pharmacy data)',
  'location.region': 'Region (Pharmacy data)',
  'location.countryCode': 'Country code (Pharmacy data)',
  'payment.recipientName': 'Recipient name (Payment details)',
  'payment.taxId': 'Tax ID / EDRPOU (Payment details)',
  'payment.iban': 'IBAN (Payment details)',
  'payment.bankName': 'Bank name (Payment details)',
  'payment.receiptEmail': 'Receipt email (Payment details)',
  'payment.paymentPurpose': 'Payment purpose (Payment details)',
  description: 'Description (About pharmacy)',
  shortDescription: 'Short description (Pharmacy data)',
  workingHours: 'Working hours (Pharmacy data)',
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
  'bankDetails.recipientName': 'Recipient name (Payment details)',
  'bankDetails.taxId': 'Tax ID / EDRPOU (Payment details)',
  'bankDetails.iban': 'IBAN (Payment details)',
  'bankDetails.bankName': 'Bank name (Payment details)',
  'bankDetails.receiptEmail': 'Receipt email (Payment details)',
  'bankDetails.paymentPurpose': 'Payment purpose (Payment details)',
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
  const preview = fields.slice(0, 3).map(getAdminAuditFieldLabel).join(', ');
  const remaining = fields.length - 3;

  return remaining > 0 ? `${preview} … ${remaining} more changes` : preview;
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

//===================================================================

/** User fields and pharmacy fields have different semantic section labels. */
export function getAdminAuditChangedFieldLabel(
  field: string,
  entityType: string
): string {
  if (entityType === 'pharmacy') {
    const pharmacyDataFields: Record<string, string> = {
      name: 'Pharmacy name (Pharmacy data)',
      phone: 'Phone (Pharmacy data)',
      email: 'Email (Pharmacy data)',
      shortDescription: 'Short description (Pharmacy data)',
      workingHours: 'Working hours (Pharmacy data)',
      imageUrl: 'Pharmacy photo (Pharmacy data)',
      photoFingerprint: 'Pharmacy photo (Pharmacy data)',
    };

    if (pharmacyDataFields[field]) return pharmacyDataFields[field];
  }

  return getAdminAuditFieldLabel(field);
}
