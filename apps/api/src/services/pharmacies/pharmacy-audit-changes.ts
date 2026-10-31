import { createHash } from 'node:crypto';

import type { AdminAuditValue } from '../../types/admin/audit/admin-audit';
import type { PharmacyEntity } from '../../types/pharmacies/pharmacy';

//===============================================================

type PharmacySnapshot = Pick<
  PharmacyEntity,
  | 'name'
  | 'phone'
  | 'email'
  | 'location'
  | 'imageUrl'
  | 'description'
  | 'shortDescription'
  | 'workingHours'
  | 'bankDetails'
  | 'documents'
  | 'status'
  | 'reviewState'
  | 'reviewFeedback'
  | 'blockSource'
  | 'statusReason'
  | 'pendingModeration'
>;

//===============================================================

/** The audit must describe field changes, never expose image bytes or file contents.
 * Payment values are visible only through the Admin audit permission boundary. */
function snapshot(pharmacy: PharmacySnapshot): Record<string, AdminAuditValue> {
  const proposed = pharmacy.pendingModeration;
  const location = { ...pharmacy.location, ...proposed?.location };
  const payment = { ...pharmacy.bankDetails, ...proposed?.bankDetails };

  const values: Record<string, AdminAuditValue> = {
    status: pharmacy.status,
    reviewState: pharmacy.reviewState ?? null,
    blockSource: pharmacy.blockSource ?? null,
    reviewFeedback: pharmacy.reviewFeedback ?? null,
    statusReason: pharmacy.statusReason ?? null,
  };

  function save(field: string, value: string | null | undefined): void {
    // Historic descriptions may exceed the audit value limit. Preserve a
    // digest so equal prefixes cannot hide differences when auditing edits.
    if (value && value.length > 1900) {
      const fingerprint = createHash('sha256')
        .update(value)
        .digest('hex')
        .slice(0, 16);
      values[field] =
        `${value.slice(0, 1840)}… [truncated; SHA-256 ${fingerprint}]`;
    } else values[field] = value ?? null;
  }

  for (const field of [
    'name',
    'phone',
    'email',
    'description',
    'shortDescription',
    'workingHours',
  ] as const) {
    save(
      field,
      proposed?.[field] === undefined ? pharmacy[field] : proposed[field]
    );
  }

  for (const field of [
    'address',
    'settlement',
    'region',
    'countryCode',
  ] as const) {
    save(`location.${field}`, location[field]);
  }

  for (const field of [
    'recipientName',
    'taxId',
    'iban',
    'bankName',
    'receiptEmail',
    'paymentPurpose',
  ] as const) {
    save(`payment.${field}`, payment[field]);
  }

  const image =
    proposed?.imageUrl === undefined ? pharmacy.imageUrl : proposed.imageUrl;

  values.photoFingerprint = image
    ? createHash('sha256').update(image).digest('hex').slice(0, 16)
    : null;

  const documents = proposed?.documents ?? pharmacy.documents ?? [];

  save(
    'documentList',
    documents
      .map((doc) => `${doc.name} (${doc.sha256.slice(0, 10)})`)
      .sort()
      .join(', ')
  );

  return values;
}

//===============================================================

export function buildPharmacyAuditChanges(
  before: PharmacySnapshot,
  after: PharmacySnapshot,
  actionDescription: string
) {
  const oldValues = snapshot(before);
  const newValues = snapshot(after);

  const changedFields = Object.keys(newValues).filter(
    (field) => oldValues[field] !== newValues[field]
  );

  if (!changedFields.length) {
    // Some valid review actions don't change a profile field. Preserve the
    // event instead of inventing a revision or marking unrelated fields.
    return {
      before: { event: actionDescription },
      after: { event: actionDescription },
      changedFields: ['event'],
    };
  }

  return {
    before: Object.fromEntries(
      changedFields.map((field) => [field, oldValues[field]])
    ),

    after: Object.fromEntries(
      changedFields.map((field) => [field, newValues[field]])
    ),

    changedFields,
  };
}
