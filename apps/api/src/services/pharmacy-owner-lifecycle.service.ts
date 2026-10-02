import mongoose, {
  Types,
  type ClientSession,
  type HydratedDocument,
} from 'mongoose';

import {
  PHARMACY_STATUSES,
  USER_ROLES,
  USER_STATUSES,
} from '../constants/auth';

import {
  ADMIN_AUDIT_ACTIONS,
  ADMIN_AUDIT_ENTITY_TYPES,
  ADMIN_AUDIT_SECTIONS,
} from '../constants/admin-audit';

import { HTTP_STATUS } from '../constants/httpStatus';

import {
  PHARMACY_OWNER_ACTIVE_ORDER_STATUSES,
  PHARMACY_OWNER_AUTO_ACTIVATION_REASON,
  PHARMACY_OWNER_LIFECYCLE_ERROR_CODES,
} from '../constants/pharmacy-owner-lifecycle';

import { Order } from '../models/order.model';
import { Pharmacy } from '../models/pharmacy.model';
import { User } from '../models/user.model';

import type { UpdateAdminPharmacyOwnerStatusInput } from '../schemas/admin-pharmacy-owner.schema';
import type { PharmacyEntity } from '../types/pharmacy';
import type { UserEntity } from '../types/user';

import { httpError } from '../utils/httpError';

import { appendAdminAuditLog } from './admin-audit.service';
import { revokeAllUserSessionsService } from './auth.service';

//===============================================================

type OwnerDocument = HydratedDocument<UserEntity>;
type PharmacyDocument = HydratedDocument<PharmacyEntity>;

export type PharmacyOwnerStatusMutationResult = Readonly<{
  ownerId: string;
  status: 'active' | 'blocked';
  blockedPharmacies: number;
}>;

//===============================================================

function isManualOwnerTransitionAllowed(
  currentStatus: UserEntity['status'],
  nextStatus: UpdateAdminPharmacyOwnerStatusInput['status']
): boolean {
  if (nextStatus === USER_STATUSES.BLOCKED) {
    return (
      currentStatus === USER_STATUSES.NEW ||
      currentStatus === USER_STATUSES.ACTIVE
    );
  }

  return (
    nextStatus === USER_STATUSES.ACTIVE &&
    currentStatus === USER_STATUSES.BLOCKED
  );
}

//===============================================================

function getOwnerNotFoundError() {
  return httpError(
    HTTP_STATUS.NOT_FOUND,
    'Pharmacy owner was not found.',
    undefined,
    PHARMACY_OWNER_LIFECYCLE_ERROR_CODES.NOT_FOUND
  );
}

//===============================================================

async function appendOwnerStatusAudit(
  owner: OwnerDocument,
  previousStatus: UserEntity['status'],
  nextStatus: UserEntity['status'],
  adminUserId: string,
  reason: string,
  auditRequestId: string,
  session: ClientSession
): Promise<void> {
  await appendAdminAuditLog({
    actorUserId: adminUserId,
    action: ADMIN_AUDIT_ACTIONS.PHARMACY_OWNER_STATUS_CHANGED,
    section: ADMIN_AUDIT_SECTIONS.PHARMACY_OWNERS,
    entityType: ADMIN_AUDIT_ENTITY_TYPES.PHARMACY_OWNER,
    entityId: String(owner._id),
    entityLabel: owner.name,
    scopeEntityType: ADMIN_AUDIT_ENTITY_TYPES.PHARMACY_OWNER,
    scopeEntityId: String(owner._id),
    before: { status: previousStatus },
    after: { status: nextStatus },
    changedFields: ['status'],
    reason,
    requestId: auditRequestId,
    session,
  });
}

//===============================================================

async function appendCascadePharmacyAudits(
  pharmacies: readonly PharmacyDocument[],
  ownerId: string,
  adminUserId: string,
  reason: string,
  auditRequestId: string,
  session: ClientSession
): Promise<void> {
  for (const pharmacy of pharmacies) {
    if (pharmacy.status === PHARMACY_STATUSES.BLOCKED) continue;

    await appendAdminAuditLog({
      actorUserId: adminUserId,
      action: ADMIN_AUDIT_ACTIONS.PHARMACY_STATUS_CHANGED,
      section: ADMIN_AUDIT_SECTIONS.PHARMACIES,
      entityType: ADMIN_AUDIT_ENTITY_TYPES.PHARMACY,
      entityId: String(pharmacy._id),
      entityLabel: pharmacy.name,
      scopeEntityType: ADMIN_AUDIT_ENTITY_TYPES.PHARMACY_OWNER,
      scopeEntityId: ownerId,
      before: { status: pharmacy.status },
      after: { status: PHARMACY_STATUSES.BLOCKED },
      changedFields: ['status'],
      reason,
      requestId: auditRequestId,
      session,
    });
  }
}

//===============================================================

async function assertOwnerHasNoActiveOrders(
  pharmacies: readonly PharmacyDocument[],
  session: ClientSession
): Promise<void> {
  if (!pharmacies.length) return;

  const activeOrdersCount = await Order.countDocuments({
    pharmacyId: { $in: pharmacies.map((pharmacy) => pharmacy._id) },
    status: { $in: PHARMACY_OWNER_ACTIVE_ORDER_STATUSES },
  }).session(session);

  if (activeOrdersCount > 0) {
    throw httpError(
      HTTP_STATUS.CONFLICT,
      'This owner cannot be deactivated while linked pharmacies have active orders.',
      undefined,
      PHARMACY_OWNER_LIFECYCLE_ERROR_CODES.HAS_ACTIVE_ORDERS
    );
  }
}

//===============================================================

export async function activateNewPharmacyOwnerForPharmacy(
  pharmacy: Pick<PharmacyEntity, 'ownerId'>,
  adminUserId: string,
  auditRequestId: string | undefined,
  session: ClientSession
): Promise<boolean> {
  const owner = await User.findOne({
    _id: pharmacy.ownerId,
    role: USER_ROLES.PHARMACY,
  }).session(session);

  if (!owner) {
    throw httpError(
      HTTP_STATUS.CONFLICT,
      'Pharmacy owner account could not be resolved. The pharmacy cannot be activated until its owner reference is repaired.',
      undefined,
      PHARMACY_OWNER_LIFECYCLE_ERROR_CODES.OWNER_REFERENCE_INVALID
    );
  }

  if (owner.status === USER_STATUSES.BLOCKED) {
    throw httpError(
      HTTP_STATUS.CONFLICT,
      'Blocked pharmacy owner must be reactivated before a linked pharmacy can be activated.',
      undefined,
      PHARMACY_OWNER_LIFECYCLE_ERROR_CODES.OWNER_BLOCKED
    );
  }

  if (owner.status !== USER_STATUSES.NEW) return false;

  const previousStatus = owner.status;
  owner.status = USER_STATUSES.ACTIVE;
  owner.statusReason = undefined;
  owner.updatedBy = new Types.ObjectId(adminUserId);
  owner.approvedBy = new Types.ObjectId(adminUserId);
  owner.approvedAt = new Date();
  await owner.save({ session });

  if (auditRequestId) {
    await appendOwnerStatusAudit(
      owner,
      previousStatus,
      USER_STATUSES.ACTIVE,
      adminUserId,
      PHARMACY_OWNER_AUTO_ACTIVATION_REASON,
      auditRequestId,
      session
    );
  }

  return true;
}

//===============================================================

export async function updatePharmacyOwnerStatusByAdminService(
  ownerId: string,
  input: UpdateAdminPharmacyOwnerStatusInput,
  adminUserId: string,
  auditRequestId: string
): Promise<PharmacyOwnerStatusMutationResult> {
  const session = await mongoose.startSession();

  try {
    const result = await session.withTransaction(async () => {
      const owner = await User.findOne({
        _id: ownerId,
        role: USER_ROLES.PHARMACY,
      }).session(session);

      if (!owner) throw getOwnerNotFoundError();

      if (!isManualOwnerTransitionAllowed(owner.status, input.status)) {
        throw httpError(
          HTTP_STATUS.BAD_REQUEST,
          `Owner account status cannot be changed from ${owner.status} to ${input.status}.`,
          undefined,
          PHARMACY_OWNER_LIFECYCLE_ERROR_CODES.INVALID_TRANSITION
        );
      }

      const reason = input.reason.trim();
      const previousStatus = owner.status;
      const pharmacies = await Pharmacy.find({ ownerId: owner._id })
        .session(session)
        .sort({ _id: 1 });

      let blockedPharmacies = 0;

      if (input.status === USER_STATUSES.BLOCKED) {
        // The guard intentionally runs inside the same transaction as the
        // owner/session/pharmacy writes. It covers every linked pharmacy.
        await assertOwnerHasNoActiveOrders(pharmacies, session);

        const pharmaciesToBlock = pharmacies.filter(
          (pharmacy) => pharmacy.status !== PHARMACY_STATUSES.BLOCKED
        );

        owner.status = USER_STATUSES.BLOCKED;
        owner.statusReason = reason;
        owner.updatedBy = new Types.ObjectId(adminUserId);
        owner.approvedBy = undefined;
        owner.approvedAt = undefined;
        await owner.save({ session });

        await revokeAllUserSessionsService(
          String(owner._id),
          'user_blocked',
          session
        );

        if (pharmaciesToBlock.length > 0) {
          const updateResult = await Pharmacy.updateMany(
            { _id: { $in: pharmaciesToBlock.map((pharmacy) => pharmacy._id) } },
            {
              $set: {
                status: PHARMACY_STATUSES.BLOCKED,
                statusReason: reason,
                updatedBy: new Types.ObjectId(adminUserId),
              },
              $unset: {
                approvedBy: '',
                approvedAt: '',
              },
            },
            { session }
          );

          blockedPharmacies = updateResult.modifiedCount;
        }

        await appendCascadePharmacyAudits(
          pharmacies,
          String(owner._id),
          adminUserId,
          reason,
          auditRequestId,
          session
        );
      } else {
        // Reactivating an owner deliberately does not touch linked pharmacy
        // statuses. Pharmacy moderation remains a separate workflow.
        owner.status = USER_STATUSES.ACTIVE;
        owner.statusReason = undefined;
        owner.updatedBy = new Types.ObjectId(adminUserId);
        owner.approvedBy = new Types.ObjectId(adminUserId);
        owner.approvedAt = new Date();
        await owner.save({ session });
      }

      await appendOwnerStatusAudit(
        owner,
        previousStatus,
        input.status,
        adminUserId,
        reason,
        auditRequestId,
        session
      );

      return {
        ownerId: String(owner._id),
        status: input.status,
        blockedPharmacies,
      } satisfies PharmacyOwnerStatusMutationResult;
    });

    if (!result) {
      throw new Error('Owner status transaction completed without a result.');
    }

    return result;
  } finally {
    await session.endSession();
  }
}
