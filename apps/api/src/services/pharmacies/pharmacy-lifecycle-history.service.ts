import { AdminAuditLog } from '../../models/audit/adminAuditLog.model';

import {
  ADMIN_AUDIT_ACTIONS,
  ADMIN_AUDIT_ENTITY_TYPES,
} from '../../constants/admin/audit/admin-audit';

import { getPharmacyMembership } from './pharmacy-membership.service';
import { resolvePharmacyAuditStatusContext } from './pharmacy-audit-status-context';

import {
  recoverBlockSourceFromStatusChange,
  resolvePreviousPharmacyBlockSources,
} from './pharmacy-block-source-read.service';

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
      'action actorUserId actorNameSnapshot createdAt reason before.status after.status before.reviewState after.reviewState before.blockSource after.blockSource'
    )

    .lean<
      Array<{
        _id: unknown;
        action: string;
        actorNameSnapshot: string;
        actorUserId: unknown;
        createdAt: Date;
        reason?: string;
        before?: {
          status?: string;
          reviewState?: string;
          blockSource?: string;
        };
        after?: { status?: string; reviewState?: string; blockSource?: string };
      }>
    >();

  const visibleEntries = entries.slice(0, PAGE_SIZE);

  // Older reactivation audit rows stored status/reviewState but omitted
  // blockSource. Recover from the preceding admin/owner block, even if that
  // event is on an earlier history page. Do not infer from reactivation actor.
  const historicalSources = await resolvePreviousPharmacyBlockSources(
    pharmacyId,
    String(membership.pharmacy.ownerId),

    visibleEntries
      .filter(
        (entry) =>
          (entry.before?.status === 'blocked' && !entry.before?.blockSource) ||
          (entry.after?.status === 'blocked' &&
            entry.action !== ADMIN_AUDIT_ACTIONS.PHARMACY_STATUS_CHANGED &&
            !entry.after?.blockSource)
      )
      .map((entry) => ({ id: String(entry._id), createdAt: entry.createdAt }))
  );

  return {
    page,
    hasMore: entries.length > PAGE_SIZE,

    items: visibleEntries.map((entry) => {
      const statusContext = resolvePharmacyAuditStatusContext({
        action: entry.action,
        before: entry.before,
        after: entry.after,
      });

      const historicalSource = historicalSources.get(String(entry._id));

      return {
        id: String(entry._id),
        action: entry.action,
        actor: entry.actorNameSnapshot,
        createdAt: entry.createdAt.toISOString(),

        ...(entry.reason ? { reason: entry.reason } : {}),

        previousStatus: statusContext.previousStatus,
        nextStatus: statusContext.nextStatus,
        previousReviewState: entry.before?.reviewState ?? null,

        previousBlockSource:
          entry.before?.blockSource ??
          (statusContext.previousStatus === 'blocked'
            ? (entry.after?.blockSource ?? historicalSource ?? null)
            : null),

        nextBlockSource:
          entry.after?.blockSource ??
          (entry.action === ADMIN_AUDIT_ACTIONS.PHARMACY_STATUS_CHANGED
            ? recoverBlockSourceFromStatusChange(
                {
                  entityId: pharmacyId,
                  actorUserId: entry.actorUserId,
                  after: entry.after,
                },
                String(membership.pharmacy.ownerId)
              )
            : statusContext.nextStatus === 'blocked'
              ? (entry.before?.blockSource ?? historicalSource ?? null)
              : null),

        // Historical corrections may not have a reviewState after snapshot.
        nextReviewState:
          entry.after?.reviewState ??
          (entry.action === ADMIN_AUDIT_ACTIONS.PHARMACY_CORRECTIONS_REQUESTED
            ? 'changes_requested'
            : null),
      };
    }),
  };
}
