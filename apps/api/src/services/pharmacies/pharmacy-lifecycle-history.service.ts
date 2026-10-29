import { AdminAuditLog } from '../../models/audit/adminAuditLog.model';

import {
  ADMIN_AUDIT_ACTIONS,
  ADMIN_AUDIT_ENTITY_TYPES,
} from '../../constants/admin/audit/admin-audit';

import { getPharmacyMembership } from './pharmacy-membership.service';

//===================================================================

/** Privacy-limited owner history: only pharmacy lifecycle events, not internal Admin audit payloads. */
const VISIBLE_ACTIONS = [
  ADMIN_AUDIT_ACTIONS.PHARMACY_CREATED,
  ADMIN_AUDIT_ACTIONS.PHARMACY_STATUS_CHANGED,
  ADMIN_AUDIT_ACTIONS.PHARMACY_MODERATION_SUBMITTED,
  ADMIN_AUDIT_ACTIONS.PHARMACY_CORRECTIONS_REQUESTED,
  ADMIN_AUDIT_ACTIONS.PHARMACY_REACTIVATION_REQUESTED,
  ADMIN_AUDIT_ACTIONS.PHARMACY_REACTIVATION_REVIEWED,
  ADMIN_AUDIT_ACTIONS.PHARMACY_REACTIVATION_REJECTED,
  ADMIN_AUDIT_ACTIONS.PHARMACY_VERIFICATION_WITHDRAWN,
  ADMIN_AUDIT_ACTIONS.PHARMACY_MODERATION_WITHDRAWN,
  ADMIN_AUDIT_ACTIONS.PHARMACY_REACTIVATION_WITHDRAWN,
] as const;

//===================================================================

export async function listOwnedPharmacyLifecycleHistoryService(
  userId: string,
  pharmacyId: string,
  page = 1
) {
  const membership = await getPharmacyMembership(userId, pharmacyId, {
    allowBlocked: true,
  });

  if (membership.membershipRole !== 'owner') {
    // Do not disclose financial/profile history to manager-only memberships.
    return { items: [], page, hasMore: false };
  }

  const PAGE_SIZE = 50;

  const entries = await AdminAuditLog.find({
    pharmacyId,
    entityType: ADMIN_AUDIT_ENTITY_TYPES.PHARMACY,
    action: { $in: VISIBLE_ACTIONS },
  })
    .sort({ createdAt: -1, _id: -1 })
    .skip((page - 1) * PAGE_SIZE)
    .limit(PAGE_SIZE + 1)

    .select(
      'action actorNameSnapshot createdAt reason before.status after.status before.reviewState after.reviewState'
    )

    .lean<
      Array<{
        _id: unknown;
        action: string;
        actorNameSnapshot: string;
        createdAt: Date;
        reason?: string;
        before?: { status?: string; reviewState?: string };
        after?: { status?: string; reviewState?: string };
      }>
    >();

  return {
    page,
    hasMore: entries.length > PAGE_SIZE,

    items: entries.slice(0, PAGE_SIZE).map((entry) => ({
      id: String(entry._id),
      action: entry.action,
      actor: entry.actorNameSnapshot,
      createdAt: entry.createdAt.toISOString(),

      ...(entry.reason ? { reason: entry.reason } : {}),

      previousStatus: entry.before?.status ?? null,
      nextStatus: entry.after?.status ?? null,
      previousReviewState: entry.before?.reviewState ?? null,
      nextReviewState: entry.after?.reviewState ?? null,
    })),
  };
}
