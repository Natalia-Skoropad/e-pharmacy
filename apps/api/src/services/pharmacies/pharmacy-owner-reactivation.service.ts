import mongoose from 'mongoose';

import { PHARMACY_STATUSES } from '../../constants/auth/auth';
import { HTTP_STATUS } from '../../constants/http/httpStatus';

import { Pharmacy } from '../../models/pharmacies/pharmacy.model';
import { PharmacyOwnerDocument } from '../../models/owners/pharmacyOwnerDocument.model';

import { httpError } from '../../utils/http/httpError';

import { getPharmacyMembership } from './pharmacy-membership.service';

import {
  serializePharmacyProfile,
  type PharmacyDocument,
} from './pharmacy-profile.shared';

import { missingRequiredModerationFields } from './pharmacy-moderation-readiness';

import {
  ensurePharmacyPaymentUniqueIndex,
  syncPharmacyPaymentIdentifiers,
} from './pharmacy-payment-uniqueness.service';

import { appendAdminAuditLog } from '../admin/audit/admin-audit-write.service';

import {
  ADMIN_AUDIT_ACTIONS,
  ADMIN_AUDIT_ENTITY_TYPES,
  ADMIN_AUDIT_SECTIONS,
} from '../../constants/admin/audit/admin-audit';

//===================================================================

/** Reactivation is its own review status; the submitted snapshot remains immutable. */
export async function requestOwnedPharmacyReactivationService(
  userId: string,
  pharmacyId: string,
  input: { reason: string; expectedRevision: string },
  requestId: string
) {
  await ensurePharmacyPaymentUniqueIndex();

  const session = await mongoose.startSession();

  try {
    return await session.withTransaction(async () => {
      const { pharmacy, membershipRole } = await getPharmacyMembership(
        userId,
        pharmacyId,
        { session, allowBlocked: true }
      );

      if (membershipRole !== 'owner')
        throw httpError(
          HTTP_STATUS.FORBIDDEN,
          'Only the owner can request reactivation.'
        );

      const resubmitting =
        pharmacy.status === PHARMACY_STATUSES.ON_REACTIVATION &&
        pharmacy.reviewState === 'changes_requested';

      if (pharmacy.status !== PHARMACY_STATUSES.BLOCKED && !resubmitting)
        throw httpError(
          HTTP_STATUS.CONFLICT,
          'Reactivation cannot be requested in the current review state.'
        );

      if (!input.reason.trim())
        throw httpError(
          HTTP_STATUS.BAD_REQUEST,
          'Reactivation reason is required.'
        );

      if (pharmacy.updatedAt.toISOString() !== input.expectedRevision)
        throw httpError(
          HTTP_STATUS.CONFLICT,
          'Pharmacy changed. Refresh and retry.'
        );

      const missing = missingRequiredModerationFields(
        pharmacy,
        pharmacy.pendingModeration ?? {}
      );

      if (missing.length)
        throw httpError(
          HTTP_STATUS.BAD_REQUEST,
          'Complete required fields before reactivation.',
          { missingFields: missing },
          'PHARMACY_PROFILE_INCOMPLETE'
        );

      const ownerDocument = await PharmacyOwnerDocument.exists({
        ownerUserId: pharmacy.ownerId,
      }).session(session);

      if (!ownerDocument)
        throw httpError(
          HTTP_STATUS.BAD_REQUEST,
          'Upload an Owner document before reactivation.'
        );

      // Refresh reservation within the same transaction: pending fields must be globally unique.
      await syncPharmacyPaymentIdentifiers(pharmacy, session);

      const updated = await Pharmacy.findOneAndUpdate(
        {
          _id: pharmacy._id,
          status: pharmacy.status,
          updatedAt: pharmacy.updatedAt,
          ...(resubmitting ? { reviewState: 'changes_requested' } : {}),
        },
        {
          $set: {
            status: PHARMACY_STATUSES.ON_REACTIVATION,
            reviewState: 'pending',
            updatedBy: userId,
          },

          $unset: { reviewFeedback: '', reviewedAt: '', reviewedBy: '' },
        },
        { new: true, session, runValidators: true }
      );

      if (!updated)
        throw httpError(
          HTTP_STATUS.CONFLICT,
          'Reactivation review changed. Refresh and retry.'
        );

      await appendAdminAuditLog({
        actorUserId: userId,
        action: ADMIN_AUDIT_ACTIONS.PHARMACY_REACTIVATION_REQUESTED,
        section: ADMIN_AUDIT_SECTIONS.PHARMACIES,
        entityType: ADMIN_AUDIT_ENTITY_TYPES.PHARMACY,
        entityId: pharmacyId,
        entityLabel: pharmacy.name,
        scopeEntityType: ADMIN_AUDIT_ENTITY_TYPES.PHARMACY_OWNER,
        scopeEntityId: String(pharmacy.ownerId),

        before: {
          status: pharmacy.status,
          reviewState: pharmacy.reviewState ?? null,
        },

        after: { status: updated.status, reviewState: 'pending' },
        changedFields: ['status', 'reviewState'],
        reason: input.reason.trim(),
        requestId,
        session,
      });

      return {
        pharmacy: serializePharmacyProfile(
          updated as PharmacyDocument,
          'owner'
        ),

        message: 'Reactivation request sent to the administrator.',
      };
    });
  } finally {
    await session.endSession();
  }
}
