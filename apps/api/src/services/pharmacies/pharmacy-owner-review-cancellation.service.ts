import mongoose from 'mongoose';

import { PHARMACY_STATUSES } from '../../constants/auth/auth';
import { HTTP_STATUS } from '../../constants/http/httpStatus';
import { ADMIN_AUDIT_ACTIONS } from '../../constants/admin/audit/admin-audit';

import { Pharmacy } from '../../models/pharmacies/pharmacy.model';

import { httpError } from '../../utils/http/httpError';

import { getPharmacyMembership } from './pharmacy-membership.service';
import { reconcileAttachedPharmacyDocumentStorage } from './pharmacy-document.service';

import {
  syncPharmacyPaymentIdentifiers,
  ensurePharmacyPaymentUniqueIndex,
} from './pharmacy-payment-uniqueness.service';

import {
  appendPharmacyOwnerMutationAudit,
  serializePharmacyProfile,
  type PharmacyDocument,
} from './pharmacy-profile.shared';

//===================================================================

export type PharmacyCancellationType =
  | 'verification'
  | 'moderation'
  | 'reactivation';

//===================================================================

/** Owner can cancel only after Admin asks for changes; pending submissions remain immutable. */
export async function cancelOwnedPharmacyReviewService(
  userId: string,
  pharmacyId: string,
  type: PharmacyCancellationType,
  expectedRevision: string,
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
          'Only the owner can cancel a review.'
        );

      const expectedStatus =
        type === 'verification'
          ? PHARMACY_STATUSES.ON_VERIFICATION
          : type === 'moderation'
            ? PHARMACY_STATUSES.ON_MODERATION
            : PHARMACY_STATUSES.ON_REACTIVATION;

      if (
        pharmacy.status !== expectedStatus ||
        pharmacy.reviewState !== 'changes_requested'
      ) {
        throw httpError(
          HTTP_STATUS.CONFLICT,
          'Wait until the administrator requests changes before cancelling review.'
        );
      }

      if (pharmacy.updatedAt.toISOString() !== expectedRevision) {
        throw httpError(
          HTTP_STATUS.CONFLICT,
          'Pharmacy changed. Refresh and retry.'
        );
      }

      const newStatus =
        type === 'verification'
          ? PHARMACY_STATUSES.NEW
          : type === 'moderation'
            ? PHARMACY_STATUSES.ACTIVE
            : PHARMACY_STATUSES.BLOCKED;

      const updated = await Pharmacy.findOneAndUpdate(
        {
          _id: pharmacy._id,
          status: expectedStatus,
          reviewState: 'changes_requested',
          updatedAt: pharmacy.updatedAt,
        },
        {
          $set: { status: newStatus, updatedBy: userId },
          $unset: {
            reviewState: '',
            reviewFeedback: '',
            reviewedAt: '',
            reviewedBy: '',

            ...(type === 'moderation' ? { pendingModeration: '' } : {}),
          },
        },
        { session, new: true, runValidators: true }
      );

      if (!updated)
        throw httpError(
          HTTP_STATUS.CONFLICT,
          'Review changed. Refresh and retry.'
        );

      if (type === 'moderation') {
        await syncPharmacyPaymentIdentifiers(updated, session);

        await reconcileAttachedPharmacyDocumentStorage(
          updated._id,
          updated.documents ?? [],
          undefined,
          session
        );
      }

      const action =
        type === 'verification'
          ? ADMIN_AUDIT_ACTIONS.PHARMACY_VERIFICATION_WITHDRAWN
          : type === 'moderation'
            ? ADMIN_AUDIT_ACTIONS.PHARMACY_MODERATION_WITHDRAWN
            : ADMIN_AUDIT_ACTIONS.PHARMACY_REACTIVATION_WITHDRAWN;

      await appendPharmacyOwnerMutationAudit(
        userId,
        pharmacy,
        updated,
        action,

        [
          'status',
          'reviewState',
          ...(type === 'moderation' ? ['pendingModeration'] : []),
        ],

        session,
        requestId,
        `Owner cancelled ${type} after administrator requested changes.`
      );

      return {
        pharmacy: serializePharmacyProfile(
          updated as PharmacyDocument,
          'owner'
        ),
      };
    });
  } finally {
    await session.endSession();
  }
}
