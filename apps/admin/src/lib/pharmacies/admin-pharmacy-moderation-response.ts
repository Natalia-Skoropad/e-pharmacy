import type { AdminPharmacyDetail } from '@e-pharmacy/types/admin';

//===================================================================

type ModerationResult = Readonly<{
  pharmacy: Readonly<{
    id: string;
    status: AdminPharmacyDetail['status'];
    updatedAt: string;
    reviewState?: AdminPharmacyDetail['reviewState'];
    reviewFeedback?: string;
  }>;
}>;

//===================================================================

const STATUSES = new Set<AdminPharmacyDetail['status']>([
  'new',
  'on_verification',
  'on_moderation',
  'on_reactivation',
  'active',
  'blocked',
]);

//===================================================================

/** Admin decisions return a pharmacy DTO without the owner-only membershipRole. */
export function parseAdminPharmacyModerationResponse(
  value: unknown
): ModerationResult {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new TypeError('Invalid moderation decision response.');

  const pharmacy = (value as Record<string, unknown>).pharmacy;

  if (!pharmacy || typeof pharmacy !== 'object' || Array.isArray(pharmacy))
    throw new TypeError('Missing pharmacy in moderation decision response.');

  const row = pharmacy as Record<string, unknown>;

  if (typeof row.id !== 'string' || !/^[0-9a-f]{24}$/i.test(row.id))
    throw new TypeError('Invalid pharmacy ID in moderation decision response.');

  if (
    typeof row.status !== 'string' ||
    !STATUSES.has(row.status as AdminPharmacyDetail['status'])
  )
    throw new TypeError(
      'Invalid pharmacy status in moderation decision response.'
    );

  if (
    typeof row.updatedAt !== 'string' ||
    Number.isNaN(Date.parse(row.updatedAt)) ||
    new Date(row.updatedAt).toISOString() !== row.updatedAt
  )
    throw new TypeError('Invalid revision in moderation decision response.');

  if (
    row.reviewState !== undefined &&
    row.reviewState !== 'pending' &&
    row.reviewState !== 'changes_requested'
  )
    throw new TypeError(
      'Invalid review state in moderation decision response.'
    );

  if (
    row.reviewFeedback !== undefined &&
    typeof row.reviewFeedback !== 'string'
  )
    throw new TypeError('Invalid feedback in moderation decision response.');

  return {
    pharmacy: {
      id: row.id,
      status: row.status as AdminPharmacyDetail['status'],
      updatedAt: row.updatedAt,

      ...(row.reviewState !== undefined
        ? { reviewState: row.reviewState as AdminPharmacyDetail['reviewState'] }
        : {}),

      ...(row.reviewFeedback !== undefined
        ? { reviewFeedback: row.reviewFeedback as string }
        : {}),
    },
  };
}
