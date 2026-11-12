import { AdminAuditLog } from '../../models/audit/adminAuditLog.model';

import {
  ADMIN_AUDIT_ACTIONS,
  ADMIN_AUDIT_ENTITY_TYPES,
} from '../../constants/admin/audit/admin-audit';

//===================================================================

type BlockSource = 'owner_deactivated' | 'admin_blocked';

//===================================================================

type PharmacyBlockReference = Readonly<{
  id: string;
  ownerId?: string;
  status: string;
  blockSource?: string | null;
}>;

type LegacyBlockLog = Readonly<{
  entityId: string;
  actorUserId: unknown;
  after?: { status?: string; blockSource?: string };
}>;

//===================================================================

export function recoverBlockSourceFromStatusChange(
  entry: LegacyBlockLog,
  ownerId?: string
): BlockSource | null {
  if (entry.after?.status !== 'blocked') return null;

  if (entry.after.blockSource === 'owner_deactivated')
    return 'owner_deactivated';

  if (entry.after.blockSource === 'admin_blocked') return 'admin_blocked';

  // The two existing blocking actions are an owner deactivation and an
  // administrator moderation block. Only infer from a recorded actor when
  // the pharmacy owner identity is known. Never infer from a status alone.
  if (!ownerId || !entry.actorUserId) return null;

  return String(entry.actorUserId) === ownerId
    ? 'owner_deactivated'
    : 'admin_blocked';
}

//===================================================================

/** Batch recovery for legacy Blocked records that predate blockSource.
 * This is read-only: immutable audit rows and pharmacy documents stay intact.
 * A missing/expired audit log yields no attribution. */
export async function resolveMissingPharmacyBlockSources(
  pharmacies: readonly PharmacyBlockReference[]
): Promise<ReadonlyMap<string, BlockSource>> {
  const missing = pharmacies.filter(
    (item) =>
      item.status === 'blocked' &&
      item.blockSource !== 'owner_deactivated' &&
      item.blockSource !== 'admin_blocked' &&
      item.ownerId
  );

  if (!missing.length) return new Map();

  const ownerByPharmacy = new Map(
    missing.map((pharmacy) => [pharmacy.id, pharmacy.ownerId])
  );

  const ids = [...ownerByPharmacy.keys()];

  const entries = await AdminAuditLog.find({
    entityType: ADMIN_AUDIT_ENTITY_TYPES.PHARMACY,
    entityId: { $in: ids },
    action: ADMIN_AUDIT_ACTIONS.PHARMACY_STATUS_CHANGED,
    'after.status': 'blocked',
  })
    .sort({ createdAt: -1, _id: -1 })
    .select('entityId actorUserId after.status after.blockSource')
    .lean<LegacyBlockLog[]>();

  const resolved = new Map<string, BlockSource>();

  for (const entry of entries) {
    if (resolved.has(entry.entityId)) continue;

    const ownerId = ownerByPharmacy.get(entry.entityId);
    const source = recoverBlockSourceFromStatusChange(entry, ownerId);

    if (source) resolved.set(entry.entityId, source);
  }

  return resolved;
}

//===================================================================

type BlockHistoryBoundary = Readonly<{
  id: string;
  createdAt: Date;
}>;

type PriorBlockLog = LegacyBlockLog &
  Readonly<{
    _id: unknown;
    createdAt: Date;
  }>;

//===================================================================

/** Read the most recent *actual blocking* event preceding each transition.
 * In particular, an owner requesting or cancelling reactivation must not
 * change who originally blocked the pharmacy. Supports old audit snapshots
 * without blockSource and pages that do not include the blocking event. */
export async function resolvePreviousPharmacyBlockSources(
  pharmacyId: string,
  ownerId: string | undefined,
  transitions: readonly BlockHistoryBoundary[]
): Promise<ReadonlyMap<string, BlockSource>> {
  if (!ownerId || !transitions.length) return new Map();

  const latest = new Date(
    Math.max(...transitions.map((entry) => entry.createdAt.getTime()))
  );

  const blockingEvents = await AdminAuditLog.find({
    entityType: ADMIN_AUDIT_ENTITY_TYPES.PHARMACY,
    $or: [{ pharmacyId }, { entityId: pharmacyId }],
    action: ADMIN_AUDIT_ACTIONS.PHARMACY_STATUS_CHANGED,
    'after.status': 'blocked',
    createdAt: { $lte: latest },
  })
    .sort({ createdAt: -1, _id: -1 })
    .select('_id entityId actorUserId createdAt after.status after.blockSource')
    .lean<PriorBlockLog[]>();

  const result = new Map<string, BlockSource>();

  for (const transition of transitions) {
    const earlierBlock = blockingEvents.find((entry) => {
      const difference =
        entry.createdAt.getTime() - transition.createdAt.getTime();

      return (
        difference < 0 ||
        (difference === 0 && String(entry._id) < transition.id)
      );
    });

    if (!earlierBlock) continue;

    const source = recoverBlockSourceFromStatusChange(earlierBlock, ownerId);

    if (source) result.set(transition.id, source);
  }

  return result;
}
