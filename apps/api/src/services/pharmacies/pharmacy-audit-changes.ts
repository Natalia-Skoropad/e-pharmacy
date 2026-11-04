import { createHash } from 'node:crypto';

import type {
  AdminAuditSnapshot,
  AdminAuditValue,
} from '../../types/admin/audit/admin-audit';

import type { PharmacyEntity } from '../../types/pharmacies/pharmacy';

//===============================================================

type PharmacySnapshot = Omit<
  Pick<
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
  >,
  'reviewState' | 'reviewFeedback'
> & {
  // MongoDB snapshots can contain null for these optional review fields.
  reviewState?: PharmacyEntity['reviewState'] | null;
  reviewFeedback?: PharmacyEntity['reviewFeedback'] | null;
};

//===================================================================

type PharmacyAuditChanges = Readonly<{
  before: AdminAuditSnapshot;
  after: AdminAuditSnapshot;
  changedFields: string[];
}>;

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
): PharmacyAuditChanges {
  const oldValues = snapshot(before);
  const newValues = snapshot(after);

  // Review feedback belongs to the administrator's corrections event.
  // Clearing that old message when the owner cancels/resubmits is not a
  // new administrator decision and must not appear in its audit Changes.
  const isCorrectionsDecision = actionDescription === 'request_corrections';

  const changedFields = Object.keys(newValues).filter(
    (field) =>
      oldValues[field] !== newValues[field] &&
      (field !== 'reviewFeedback' || isCorrectionsDecision)
  );

  // A single lifecycle transition has one status row. The underlying status
  // and reviewState must both remain available as context for that row.
  if (
    changedFields.includes('reviewState') &&
    changedFields.includes('status')
  ) {
    changedFields.splice(changedFields.indexOf('status'), 1);
  }

  if (!changedFields.length) {
    // Some valid review actions don't change a profile field. Preserve the
    // event instead of inventing a revision or marking unrelated fields.
    return {
      before: { event: actionDescription },
      after: { event: actionDescription },
      changedFields: ['event'],
    };
  }

  const hasReviewTransition = changedFields.includes('reviewState');
  const auditBefore: Record<string, AdminAuditValue> = {};
  const auditAfter: Record<string, AdminAuditValue> = {};

  for (const field of changedFields) {
    auditBefore[field] = oldValues[field] ?? null;
    auditAfter[field] = newValues[field] ?? null;
  }

  if (hasReviewTransition) {
    // Preserve unchanged status as context for the status badges.
    // It is not a second entry in changedFields.
    auditBefore.status = oldValues.status ?? null;
    auditAfter.status = newValues.status ?? null;
  }

  // Preserve safe image references in this Admin-only audit record when the
  // pharmacy photo changes. No image bytes or document contents are logged.
  // These metadata fields are intentionally NOT separate change rows.
  if (changedFields.includes('photoFingerprint')) {
    const beforePhoto =
      before.pendingModeration?.imageUrl === undefined
        ? before.imageUrl
        : before.pendingModeration.imageUrl;

    const afterPhoto =
      after.pendingModeration?.imageUrl === undefined
        ? after.imageUrl
        : after.pendingModeration.imageUrl;

    const safeReference = (value: string | undefined | null) =>
      value &&
      value.length <= 1024 &&
      (/^https?:\/\//i.test(value) || value.startsWith('/'))
        ? value
        : null;

    auditBefore.photoPreviewUrl = safeReference(beforePhoto);
    auditAfter.photoPreviewUrl = safeReference(afterPhoto);
  }

  return { before: auditBefore, after: auditAfter, changedFields };
}
