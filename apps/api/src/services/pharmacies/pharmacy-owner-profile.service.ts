import mongoose from 'mongoose';

import { PHARMACY_STATUSES } from '../../constants/auth/auth';
import { ADMIN_AUDIT_ACTIONS } from '../../constants/admin/audit/admin-audit';
import { HTTP_STATUS } from '../../constants/http/httpStatus';

import {
  PHARMACY_PROFILE_LOCKED_ERROR_CODE,
  canPharmacyProfilePerformAction,
} from '../../constants/pharmacies/pharmacy-profile';

import { Pharmacy } from '../../models/pharmacies/pharmacy.model';

import type {
  CurrentPharmacySummaryResponseDto,
  MyPharmacyProfileResponseDto,
  UpdateMyPharmacyProfileInput,
} from '../../types/pharmacies/pharmacy';

import { httpError } from '../../utils/http/httpError';

import {
  resolvePrivatePharmacyDocumentSelections,
  reconcileAttachedPharmacyDocumentStorage,
} from './pharmacy-document.service';

import {
  findPharmacyForProfileAccess,
  findPharmacyForSummaryAccess,
} from './pharmacy-membership.service';

import {
  serializePharmacyProfile,
  serializeCurrentPharmacySummary,
  hasModeratedProfileChanges,
  buildPendingModerationPayload,
  assertPharmacyProfileRevision,
  throwPharmacyProfileConflict,
  safePharmacyEditedSections,
  appendPharmacyOwnerMutationAudit,
  type PharmacyDocument,
  type ResolvedPharmacyProfileUpdate,
} from './pharmacy-profile.shared';

//===============================================================

export async function getCurrentPharmacySummaryService(
  userId: string
): Promise<{ pharmacy: CurrentPharmacySummaryResponseDto | null }> {
  // A newly registered owner legitimately has no Pharmacy yet. Keep this
  // distinction local to summary bootstrap; pharmacy-scoped APIs must still
  // reject missing/ambiguous membership.
  try {
    const { pharmacy, membershipRole } =
      await findPharmacyForSummaryAccess(userId);

    return {
      pharmacy: serializeCurrentPharmacySummary(
        pharmacy as PharmacyDocument,
        membershipRole
      ),
    };
  } catch (cause) {
    if (
      cause &&
      typeof cause === 'object' &&
      'code' in cause &&
      cause.code === 'PHARMACY_PROFILE_MISSING'
    ) {
      return { pharmacy: null };
    }

    throw cause;
  }
}

//===============================================================

export async function getMyPharmacyProfileService(
  userId: string,
  pharmacyId?: string
): Promise<{ pharmacy: MyPharmacyProfileResponseDto }> {
  const { pharmacy, membershipRole } = await findPharmacyForProfileAccess(
    userId,
    'read_profile',
    undefined,
    pharmacyId
  );

  return {
    pharmacy: serializePharmacyProfile(
      pharmacy as PharmacyDocument,
      membershipRole
    ),
  };
}

//===============================================================

export async function updateMyPharmacyProfileService(
  userId: string,
  input: UpdateMyPharmacyProfileInput,
  auditRequestId?: string,
  pharmacyId?: string
): Promise<{ pharmacy: MyPharmacyProfileResponseDto }> {
  const mongoSession = await mongoose.startSession();

  let result: { pharmacy: MyPharmacyProfileResponseDto } | null = null;

  try {
    await mongoSession.withTransaction(async () => {
      const { pharmacy, membershipRole } = await findPharmacyForProfileAccess(
        userId,
        'edit_profile',
        mongoSession,
        pharmacyId
      );

      if (
        !canPharmacyProfilePerformAction(
          pharmacy.status,
          'edit',
          pharmacy.reviewState
        )
      ) {
        throw httpError(
          HTTP_STATUS.BAD_REQUEST,
          'Profile fields are locked until Admin reviews the submitted pharmacy data.',
          undefined,

          PHARMACY_PROFILE_LOCKED_ERROR_CODE
        );
      }

      assertPharmacyProfileRevision(pharmacy, input.expectedRevision);

      const {
        documents: documentSelections,
        expectedRevision,

        ...profileFields
      } = input;

      const resolvedInput: ResolvedPharmacyProfileUpdate = {
        ...profileFields,

        ...(documentSelections !== undefined
          ? {
              documents: await resolvePrivatePharmacyDocumentSelections(
                pharmacy._id,
                documentSelections,
                mongoSession
              ),
            }
          : {}),
      };

      const isCorrectionDraft =
        pharmacy.status === PHARMACY_STATUSES.ON_MODERATION &&
        pharmacy.reviewState === 'changes_requested';

      if (
        (pharmacy.status === PHARMACY_STATUSES.ACTIVE || isCorrectionDraft) &&
        hasModeratedProfileChanges(resolvedInput)
      ) {
        const pendingModeration = buildPendingModerationPayload(
          pharmacy.pendingModeration,
          resolvedInput,
          pharmacy.location
        );

        const updatedPharmacy = await Pharmacy.findOneAndUpdate(
          {
            _id: pharmacy._id,
            updatedAt: new Date(expectedRevision),
            status: pharmacy.status,

            ...(isCorrectionDraft ? { reviewState: 'changes_requested' } : {}),
          },

          {
            $set: {
              pendingModeration,
              updatedBy: userId,
            },

            $unset: { statusReason: '' },
          },

          { new: true, runValidators: true, session: mongoSession }
        );

        if (!updatedPharmacy) throwPharmacyProfileConflict();

        await reconcileAttachedPharmacyDocumentStorage(
          updatedPharmacy._id,
          updatedPharmacy.documents ?? [],
          updatedPharmacy.pendingModeration?.documents,
          mongoSession
        );

        await appendPharmacyOwnerMutationAudit(
          userId,
          pharmacy,
          updatedPharmacy,
          ADMIN_AUDIT_ACTIONS.PHARMACY_PROFILE_UPDATED,
          safePharmacyEditedSections(resolvedInput),
          mongoSession,
          auditRequestId
        );

        result = {
          pharmacy: serializePharmacyProfile(
            updatedPharmacy as PharmacyDocument,
            membershipRole
          ),
        };

        return;
      }

      const update: Record<string, unknown> = { updatedBy: userId };
      const unset: Record<string, ''> = {};

      const applyClearableField = (key: string, value: unknown) => {
        if (value === undefined) return;
        if (value === null) unset[key] = '';
        else update[key] = value;
      };

      if (resolvedInput.name !== undefined) update.name = resolvedInput.name;

      if (resolvedInput.location) {
        for (const field of ['address', 'settlement', 'region'] as const) {
          applyClearableField(
            `location.${field}`,
            resolvedInput.location[field]
          );
        }
      }

      if (!pharmacy.location?.countryCode) {
        update['location.countryCode'] = 'UA';
      }

      applyClearableField('phone', resolvedInput.phone);
      applyClearableField('email', resolvedInput.email);
      applyClearableField('workingHours', resolvedInput.workingHours);
      applyClearableField('imageUrl', resolvedInput.imageUrl);
      applyClearableField('description', resolvedInput.description);
      applyClearableField('shortDescription', resolvedInput.shortDescription);

      if (resolvedInput.documents !== undefined)
        update.documents = resolvedInput.documents;

      if (resolvedInput.bankDetails) {
        for (const [key, value] of Object.entries(resolvedInput.bankDetails)) {
          const path = `bankDetails.${key}`;

          if (value === null) unset[path] = '';
          else if (value !== undefined) update[path] = value;
        }
      }

      const updateQuery: Record<string, unknown> = { $set: update };

      if (Object.keys(unset).length > 0) updateQuery.$unset = unset;

      const updatedPharmacy = await Pharmacy.findOneAndUpdate(
        { _id: pharmacy._id, updatedAt: new Date(expectedRevision) },

        updateQuery,

        { new: true, runValidators: true, session: mongoSession }
      );

      if (!updatedPharmacy) throwPharmacyProfileConflict();

      await reconcileAttachedPharmacyDocumentStorage(
        updatedPharmacy._id,
        updatedPharmacy.documents ?? [],
        updatedPharmacy.pendingModeration?.documents,
        mongoSession
      );

      await appendPharmacyOwnerMutationAudit(
        userId,
        pharmacy,
        updatedPharmacy,
        ADMIN_AUDIT_ACTIONS.PHARMACY_PROFILE_UPDATED,
        safePharmacyEditedSections(resolvedInput),
        mongoSession,
        auditRequestId
      );

      result = {
        pharmacy: serializePharmacyProfile(
          updatedPharmacy as PharmacyDocument,
          membershipRole
        ),
      };
    });
  } finally {
    await mongoSession.endSession();
  }

  if (!result) {
    throw new Error('Pharmacy profile update transaction did not commit.');
  }

  return result;
}
