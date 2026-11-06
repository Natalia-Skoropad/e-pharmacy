import { Types, type ClientSession } from 'mongoose';

import {
  ADMIN_AUDIT_ENTITY_TYPES,
  ADMIN_AUDIT_LIMITS,
  isAdminAuditAction,
  isAdminAuditEntityType,
  isAdminAuditSection,
  type AdminAuditAction,
  type AdminAuditEntityType,
  type AdminAuditSection,
} from '../../../constants/admin/audit/admin-audit';

import { AdminAuditLog } from '../../../models/audit/adminAuditLog.model';
import { User } from '../../../models/accounts/user.model';
import { appendAuditPharmacyPhotos } from './admin-audit-photo.service';

import type { AdminAuditSnapshot } from '../../../types/admin/audit/admin-audit';

import {
  normalizeAdminAuditSnapshot,
  normalizeAuditString,
  normalizeChangedFields,
} from './admin-audit-normalization';

//===============================================================

type AppendAdminAuditLogInput = Readonly<{
  actorUserId: string;
  action: AdminAuditAction;
  section: AdminAuditSection;
  entityType: AdminAuditEntityType;
  entityId: string;
  entityLabel: string;
  scopeEntityType?: AdminAuditEntityType;
  scopeEntityId?: string;
  pharmacyId?: string;
  before: AdminAuditSnapshot;
  after: AdminAuditSnapshot;
  changedFields: readonly string[];
  reason?: string;
  requestId: string;
  mutationKey?: string;
  session?: ClientSession;

  pharmacyPhotoSnapshots?: Readonly<{
    before?: string | null;
    after?: string | null;
  }>;
}>;

//===============================================================

export async function appendAdminAuditLog({
  actorUserId,
  action,
  section,
  entityType,
  entityId,
  entityLabel,
  scopeEntityType,
  scopeEntityId,
  pharmacyId: explicitPharmacyId,
  before: rawBefore,
  after: rawAfter,
  changedFields: rawChangedFields,
  reason,
  requestId,
  mutationKey,
  session,
  pharmacyPhotoSnapshots,
}: AppendAdminAuditLogInput): Promise<void> {
  if (!Types.ObjectId.isValid(actorUserId)) {
    throw new TypeError('Audit actorUserId is invalid.');
  }

  // Identify the invalid contract field without logging private values.
  // These are the same runtime validators used for API audit filters; do not
  // bypass them for client comments or future audit UI work.
  if (!isAdminAuditAction(action)) {
    throw new TypeError('Audit action is invalid.');
  }

  if (!isAdminAuditSection(section)) {
    throw new TypeError('Audit section is invalid.');
  }

  if (!isAdminAuditEntityType(entityType)) {
    throw new TypeError('Audit entity type is invalid.');
  }

  if (Boolean(scopeEntityType) !== Boolean(scopeEntityId)) {
    throw new TypeError(
      'Audit scope entity type and id must be provided together.'
    );
  }

  if (scopeEntityType && !isAdminAuditEntityType(scopeEntityType)) {
    throw new TypeError('Audit scope entity type is invalid.');
  }

  // Pharmacy events retain their owner scope. Comment events retain their
  // pharmacy scope. Both store a canonical exact pharmacy identifier.
  const derivedPharmacyId =
    entityType === ADMIN_AUDIT_ENTITY_TYPES.PHARMACY
      ? entityId
      : scopeEntityType === ADMIN_AUDIT_ENTITY_TYPES.PHARMACY
        ? scopeEntityId
        : undefined;

  if (
    (explicitPharmacyId && !Types.ObjectId.isValid(explicitPharmacyId)) ||
    (derivedPharmacyId && !Types.ObjectId.isValid(derivedPharmacyId)) ||
    (explicitPharmacyId &&
      derivedPharmacyId &&
      explicitPharmacyId.toLowerCase() !== derivedPharmacyId.toLowerCase())
  ) {
    throw new TypeError('Audit pharmacyId is invalid or inconsistent.');
  }

  const pharmacyId = (explicitPharmacyId ?? derivedPharmacyId)?.toLowerCase();

  const before = normalizeAdminAuditSnapshot(
    rawBefore,
    'Audit before snapshot'
  );

  const after = normalizeAdminAuditSnapshot(rawAfter, 'Audit after snapshot');
  const changedFields = normalizeChangedFields(rawChangedFields, before, after);

  // Never persist a photo change without its companion photo audit snapshot.
  if (
    !session &&
    entityType === ADMIN_AUDIT_ENTITY_TYPES.PHARMACY &&
    changedFields.includes('photoFingerprint') &&
    pharmacyPhotoSnapshots
  ) {
    throw new TypeError('Photo auditing requires a transaction session.');
  }

  const actor = await User.findById(actorUserId)
    .select('_id name email')
    .session(session ?? null)
    .lean<{ _id: Types.ObjectId; name?: string; email?: string } | null>();

  if (!actor) {
    throw new Error('Audit actor could not be resolved.');
  }

  // Older/imported pharmacy accounts may lack a name even though the current
  // User schema requires it. Auditing must not turn a valid comment mutation
  // into a 500 by calling `.trim()` on an undefined legacy value. Resolve the
  // snapshot from persisted identity only; never trust a name from the request.
  const actorName = typeof actor.name === 'string' ? actor.name.trim() : '';
  const actorEmail = typeof actor.email === 'string' ? actor.email.trim() : '';

  const auditActorName =
    (actorName.length > 0 && actorName.length <= ADMIN_AUDIT_LIMITS.actorName
      ? actorName
      : '') ||
    (actorEmail.length > 0 && actorEmail.length <= ADMIN_AUDIT_LIMITS.actorName
      ? actorEmail
      : '') ||
    `Account ${String(actor._id).slice(-8)}`;

  const normalizedReason = reason?.trim();

  const [auditLog] = await AdminAuditLog.create(
    [
      {
        actorUserId: actor._id,

        actorNameSnapshot: normalizeAuditString(
          auditActorName,
          'Audit actor name',
          ADMIN_AUDIT_LIMITS.actorName
        ),

        action,
        section,
        entityType,

        entityId: normalizeAuditString(
          entityId,
          'Audit entity id',
          ADMIN_AUDIT_LIMITS.entityId
        ),

        entityLabelSnapshot: normalizeAuditString(
          entityLabel,
          'Audit entity label',
          ADMIN_AUDIT_LIMITS.entityLabel
        ),

        ...(scopeEntityType && scopeEntityId
          ? {
              scopeEntityType,
              scopeEntityId: normalizeAuditString(
                scopeEntityId,
                'Audit scope entity id',
                ADMIN_AUDIT_LIMITS.entityId
              ),
            }
          : {}),

        ...(pharmacyId ? { pharmacyId } : {}),

        before,
        after,
        changedFields,

        ...(mutationKey
          ? {
              mutationKey: normalizeAuditString(
                mutationKey,
                'Mutation key',
                ADMIN_AUDIT_LIMITS.requestId
              ),
            }
          : {}),

        ...(normalizedReason
          ? {
              reason: normalizeAuditString(
                normalizedReason,
                'Audit reason',
                ADMIN_AUDIT_LIMITS.reason
              ),
            }
          : {}),

        requestId: normalizeAuditString(
          requestId,
          'Audit request id',

          ADMIN_AUDIT_LIMITS.requestId
        ),
      },
    ],
    session ? { session } : {}
  );

  if (
    entityType === ADMIN_AUDIT_ENTITY_TYPES.PHARMACY &&
    changedFields.includes('photoFingerprint') &&
    pharmacyPhotoSnapshots
  ) {
    if (!session)
      throw new TypeError('Photo auditing requires a transaction session.');

    await appendAuditPharmacyPhotos({
      auditLogId: auditLog._id,
      ...pharmacyPhotoSnapshots,
      session,
    });
  }
}
