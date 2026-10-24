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

import type { AdminAuditSnapshot } from '../../../types/admin-audit';

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
  session: ClientSession;
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
}: AppendAdminAuditLogInput): Promise<void> {
  if (!Types.ObjectId.isValid(actorUserId)) {
    throw new TypeError('Audit actorUserId is invalid.');
  }

  if (
    !isAdminAuditAction(action) ||
    !isAdminAuditSection(section) ||
    !isAdminAuditEntityType(entityType)
  ) {
    throw new TypeError('Audit action, section, or entity type is invalid.');
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

  const actor = await User.findById(actorUserId)
    .select('_id name')
    .session(session)
    .lean<{ _id: Types.ObjectId; name: string } | null>();

  if (!actor) {
    throw new Error('Audit actor could not be resolved.');
  }

  const normalizedReason = reason?.trim();

  await AdminAuditLog.create(
    [
      {
        actorUserId: actor._id,

        actorNameSnapshot: normalizeAuditString(
          actor.name,
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
    { session }
  );
}
