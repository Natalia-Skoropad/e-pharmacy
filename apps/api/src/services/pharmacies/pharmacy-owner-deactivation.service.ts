import mongoose, { type ClientSession, type Types } from 'mongoose';

import { PHARMACY_STATUSES } from '../../constants/auth/auth';

import {
  ADMIN_AUDIT_ACTIONS,
  ADMIN_AUDIT_ENTITY_TYPES,
  ADMIN_AUDIT_SECTIONS,
} from '../../constants/admin/audit/admin-audit';

import { PHARMACY_OWNER_ACTIVE_ORDER_STATUSES } from '../../constants/owners/pharmacy-owner-lifecycle';
import { HTTP_STATUS } from '../../constants/http/httpStatus';

import { Pharmacy } from '../../models/pharmacies/pharmacy.model';
import { Order } from '../../models/orders/order.model';
import { ProductRequest } from '../../models/catalog/productRequest.model';

import { appendAdminAuditLog } from '../admin/audit/admin-audit-write.service';
import { getPharmacyMembership } from './pharmacy-membership.service';

import {
  serializePharmacyProfile,
  type PharmacyDocument,
} from './pharmacy-profile.shared';

import { httpError } from '../../utils/http/httpError';

//===============================================================

type DeactivationInput = Readonly<{
  reason: string;
  expectedRevision: string;
}>;

//===============================================================

/** Same predicates for the button and the transactional mutation. */
async function countUnfinishedPharmacyWork(
  pharmacyId: Types.ObjectId,
  session?: ClientSession
) {
  const orders = Order.countDocuments({
    pharmacyId,
    status: { $in: PHARMACY_OWNER_ACTIVE_ORDER_STATUSES },
  });

  const requests = ProductRequest.countDocuments({
    pharmacyId,
    status: { $in: ['draft', 'new', 'in_progress'] },
  });

  if (session) {
    orders.session(session);
    requests.session(session);
  }

  const [activeOrders, activeProductRequests] = await Promise.all([
    orders,
    requests,
  ]);

  return { activeOrders, activeProductRequests };
}

//===============================================================

export async function getOwnedPharmacyDeactivationEligibilityService(
  userId: string,
  pharmacyId: string
) {
  const { pharmacy, membershipRole } = await getPharmacyMembership(
    userId,
    pharmacyId
  );
  if (membershipRole !== 'owner') {
    throw httpError(
      HTTP_STATUS.FORBIDDEN,
      'Only a pharmacy owner can manage its status.'
    );
  }

  const { activeOrders, activeProductRequests } =
    await countUnfinishedPharmacyWork(pharmacy._id);

  const operational =
    pharmacy.status === PHARMACY_STATUSES.ACTIVE ||
    pharmacy.status === PHARMACY_STATUSES.ON_MODERATION;

  const canDeactivate = operational && !activeOrders && !activeProductRequests;

  const reason = !operational
    ? 'This pharmacy cannot be deactivated from its current status.'
    : canDeactivate
      ? ''
      : `Deactivation is unavailable. Close ${activeOrders} unfinished order(s) and ${activeProductRequests} unfinished product request(s) first.`;

  return { canDeactivate, activeOrders, activeProductRequests, reason };
}

//===============================================================

/** Owner-only deactivation with the same unfinished-order rule as Admin. */
export async function deactivateOwnedPharmacyService(
  userId: string,
  pharmacyId: string,
  input: DeactivationInput,
  requestId: string
) {
  const session = await mongoose.startSession();

  try {
    return await session.withTransaction(async () => {
      const { pharmacy, membershipRole } = await getPharmacyMembership(
        userId,
        pharmacyId,
        { session }
      );

      if (membershipRole !== 'owner') {
        throw httpError(
          HTTP_STATUS.FORBIDDEN,
          'Only the pharmacy owner can deactivate it.'
        );
      }

      if (
        pharmacy.status !== PHARMACY_STATUSES.ACTIVE &&
        pharmacy.status !== PHARMACY_STATUSES.ON_MODERATION
      ) {
        throw httpError(
          HTTP_STATUS.CONFLICT,
          'Only an operational pharmacy can be deactivated.'
        );
      }

      if (pharmacy.updatedAt.toISOString() !== input.expectedRevision) {
        throw httpError(
          HTTP_STATUS.CONFLICT,
          'Pharmacy details have changed. Refresh and try again.'
        );
      }

      const unfinished = await countUnfinishedPharmacyWork(
        pharmacy._id,
        session
      );

      if (unfinished.activeOrders || unfinished.activeProductRequests) {
        throw httpError(
          HTTP_STATUS.CONFLICT,
          'Close all unfinished orders and product requests before deactivating the pharmacy.'
        );
      }

      const blocked = await Pharmacy.findOneAndUpdate(
        {
          _id: pharmacy._id,
          status: pharmacy.status,
          updatedAt: pharmacy.updatedAt,
        },
        {
          $set: {
            status: PHARMACY_STATUSES.BLOCKED,
            statusReason: input.reason.trim(),
            updatedBy: userId,
          },
        },
        { session, new: true, runValidators: true }
      );

      if (!blocked) {
        throw httpError(
          HTTP_STATUS.CONFLICT,
          'Pharmacy has changed. Refresh and try again.'
        );
      }

      await appendAdminAuditLog({
        actorUserId: userId,
        action: ADMIN_AUDIT_ACTIONS.PHARMACY_STATUS_CHANGED,
        section: ADMIN_AUDIT_SECTIONS.PHARMACIES,
        entityType: ADMIN_AUDIT_ENTITY_TYPES.PHARMACY,
        entityId: pharmacyId,
        entityLabel: blocked.name,
        scopeEntityType: ADMIN_AUDIT_ENTITY_TYPES.PHARMACY_OWNER,
        scopeEntityId: String(blocked.ownerId),

        before: {
          status: pharmacy.status,
          revision: pharmacy.updatedAt.toISOString(),
        },

        after: {
          status: blocked.status,
          revision: blocked.updatedAt.toISOString(),
        },

        changedFields: ['status', 'revision'],
        reason: input.reason.trim(),
        requestId,
        session,
      });

      return {
        pharmacy: serializePharmacyProfile(
          blocked as PharmacyDocument,
          'owner'
        ),

        message: 'Pharmacy deactivated.',
      };
    });
  } finally {
    await session.endSession();
  }
}
