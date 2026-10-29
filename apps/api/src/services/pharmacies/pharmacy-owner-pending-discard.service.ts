import mongoose from 'mongoose';

import { PHARMACY_STATUSES } from '../../constants/auth/auth';
import { ADMIN_AUDIT_ACTIONS } from '../../constants/admin/audit/admin-audit';
import { HTTP_STATUS } from '../../constants/http/httpStatus';

import { Pharmacy } from '../../models/pharmacies/pharmacy.model';
import { httpError } from '../../utils/http/httpError';

import { getPharmacyMembership } from './pharmacy-membership.service';
import { reconcileAttachedPharmacyDocumentStorage } from './pharmacy-document.service';

import {
  ensurePharmacyPaymentUniqueIndex,
  syncPharmacyPaymentIdentifiers,
} from './pharmacy-payment-uniqueness.service';

import {
  appendPharmacyOwnerMutationAudit,
  serializePharmacyProfile,
  type PharmacyDocument,
} from './pharmacy-profile.shared';

//===============================================================

const SECTION_KEYS = {
  data: [
    'name',
    'address',
    'settlement',
    'region',
    'phone',
    'email',
    'workingHours',
    'imageUrl',
    'shortDescription',
  ],

  about: ['description'],

  payment: [
    'recipientName',
    'taxId',
    'iban',
    'bankName',
    'receiptEmail',
    'paymentPurpose',
  ],

  documents: ['documents'],
} as const;

//===============================================================

/** Discard only unsubmitted, owner-scoped changes in the selected tab. */
export async function discardOwnedPharmacyPendingSectionService(
  userId: string,
  pharmacyId: string,

  input: {
    section: keyof typeof SECTION_KEYS;
    field: string;
    expectedRevision: string;
  },

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

      if (membershipRole !== 'owner') {
        throw httpError(
          HTTP_STATUS.FORBIDDEN,
          'Only the pharmacy owner can remove saved changes.'
        );
      }

      const canDiscard =
        pharmacy.status === PHARMACY_STATUSES.ACTIVE ||
        (pharmacy.status === PHARMACY_STATUSES.ON_MODERATION &&
          pharmacy.reviewState === 'changes_requested') ||
        pharmacy.status === PHARMACY_STATUSES.BLOCKED ||
        (pharmacy.status === PHARMACY_STATUSES.ON_REACTIVATION &&
          pharmacy.reviewState === 'changes_requested');

      if (!canDiscard) {
        throw httpError(
          HTTP_STATUS.CONFLICT,
          'Submitted changes cannot be removed while under review.'
        );
      }

      if (pharmacy.updatedAt.toISOString() !== input.expectedRevision) {
        throw httpError(
          HTTP_STATUS.CONFLICT,
          'Pharmacy was updated. Refresh and try again.'
        );
      }

      if (
        !(SECTION_KEYS[input.section] as readonly string[]).includes(
          input.field
        )
      ) {
        throw httpError(
          HTTP_STATUS.BAD_REQUEST,
          'The field does not belong to the selected tab.'
        );
      }

      const pending = pharmacy.pendingModeration;
      const remaining: Record<string, unknown> = { ...(pending ?? {}) };

      const group =
        input.section === 'payment'
          ? 'bankDetails'
          : ['address', 'settlement', 'region'].includes(input.field)
            ? 'location'
            : null;

      if (group) {
        const nested = {
          ...((remaining[group] as Record<string, unknown> | undefined) ?? {}),
        };

        if (!(input.field in nested)) {
          throw httpError(
            HTTP_STATUS.BAD_REQUEST,
            'This field has no saved changes.'
          );
        }

        delete nested[input.field];

        if (Object.keys(nested).length) remaining[group] = nested;
        else delete remaining[group];
      } else {
        if (!(input.field in remaining)) {
          throw httpError(
            HTTP_STATUS.BAD_REQUEST,
            'This field has no saved changes.'
          );
        }

        delete remaining[input.field];
      }

      const update = Object.keys(remaining).length
        ? { $set: { pendingModeration: remaining, updatedBy: userId } }
        : { $set: { updatedBy: userId }, $unset: { pendingModeration: '' } };

      const updated = await Pharmacy.findOneAndUpdate(
        {
          _id: pharmacy._id,
          status: pharmacy.status,
          updatedAt: pharmacy.updatedAt,
        },

        update,

        { session, new: true, runValidators: true }
      );
      if (!updated) {
        throw httpError(
          HTTP_STATUS.CONFLICT,
          'Pharmacy changed while removing saved changes.'
        );
      }

      await syncPharmacyPaymentIdentifiers(updated, session);

      await reconcileAttachedPharmacyDocumentStorage(
        updated._id,
        updated.documents ?? [],
        updated.pendingModeration?.documents,
        session
      );

      await appendPharmacyOwnerMutationAudit(
        userId,
        pharmacy,
        updated,

        ADMIN_AUDIT_ACTIONS.PHARMACY_PROFILE_UPDATED,
        [`discarded:${input.section}.${input.field}`],

        session,
        requestId,
        `Owner discarded unsubmitted change ${input.section}.${input.field}`
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
