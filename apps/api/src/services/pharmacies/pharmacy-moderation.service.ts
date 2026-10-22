import mongoose from 'mongoose';

import { PHARMACY_STATUSES } from '../../constants/auth';
import { ADMIN_AUDIT_ACTIONS } from '../../constants/admin-audit';
import { HTTP_STATUS } from '../../constants/httpStatus';

import {
  PHARMACY_PROFILE_ALREADY_SUBMITTED_ERROR_CODE,
  PHARMACY_PROFILE_INCOMPLETE_ERROR_CODE,
  PHARMACY_NO_PENDING_CHANGES_ERROR_CODE,
  PHARMACY_PROFILE_LOCKED_ERROR_CODE,
} from '../../constants/pharmacy-profile';

import { Pharmacy } from '../../models/pharmacy.model';
import { PharmacyOwnerDocument } from '../../models/pharmacyOwnerDocument.model';

import type {
  MyPharmacyProfileResponseDto,
  SubmitMyPharmacyModerationInput,
} from '../../types/pharmacy';

import { httpError } from '../../utils/httpError';

import {
  resolvePrivatePharmacyDocumentSelections,
  reconcileAttachedPharmacyDocumentStorage,
} from './pharmacy-document.service';

import { findPharmacyForProfileAccess } from './pharmacy-membership.service';
import { clonePendingModerationFields as normalizePendingModerationPayload } from './pharmacy-location';

import {
  serializePharmacyProfile,
  hasModeratedProfileChanges,
  buildPendingModerationPayload,
  assertPharmacyProfileRevision,
  throwPharmacyProfileConflict,
  safePharmacyEditedSections,
  appendPharmacyOwnerMutationAudit,
  type PharmacyDocument,
  type PharmacyHydratedDocument,
  type ResolvedPharmacyProfileUpdate,
} from './pharmacy-profile.shared';

//===============================================================

function assertReadyForVerification(pharmacy: PharmacyHydratedDocument): void {
  const bankDetails = pharmacy.bankDetails;

  const requiredFields: Record<string, unknown> = {
    name: pharmacy.name,
    address: pharmacy.location?.address,
    settlement: pharmacy.location?.settlement,
    region: pharmacy.location?.region,
    countryCode: pharmacy.location?.countryCode,
    phone: pharmacy.phone,
    email: pharmacy.email,

    workingHours: pharmacy.workingHours,
    imageUrl: pharmacy.imageUrl,
    description: pharmacy.description,
    shortDescription: pharmacy.shortDescription,

    recipientName: bankDetails?.recipientName,
    taxId: bankDetails?.taxId,
    iban: bankDetails?.iban,
    bankName: bankDetails?.bankName,
    receiptEmail: bankDetails?.receiptEmail,
    paymentPurpose: bankDetails?.paymentPurpose,

    documents: pharmacy.documents?.length,
  };

  const missingFields = Object.entries(requiredFields)
    .filter(([, value]) => !value)
    .map(([field]) => field);

  if (missingFields.length > 0) {
    throw httpError(
      HTTP_STATUS.BAD_REQUEST,
      'Complete pharmacy profile before verification.',
      {
        missingFields,
      },

      PHARMACY_PROFILE_INCOMPLETE_ERROR_CODE
    );
  }
}

//===============================================================

export async function submitMyPharmacyModerationService(
  userId: string,
  input: SubmitMyPharmacyModerationInput,
  auditRequestId?: string
): Promise<{ pharmacy: MyPharmacyProfileResponseDto; message: string }> {
  const mongoSession = await mongoose.startSession();

  let result: {
    pharmacy: MyPharmacyProfileResponseDto;
    message: string;
  } | null = null;

  try {
    await mongoSession.withTransaction(async () => {
      const { pharmacy, membershipRole } = await findPharmacyForProfileAccess(
        userId,
        'submit_profile',
        mongoSession
      );

      const isResubmission =
        pharmacy.status === PHARMACY_STATUSES.ON_MODERATION &&
        pharmacy.reviewState === 'changes_requested';

      if (
        pharmacy.status === PHARMACY_STATUSES.ON_MODERATION &&
        !isResubmission
      ) {
        throw httpError(
          HTTP_STATUS.CONFLICT,
          'Pharmacy profile is already submitted for review.',
          undefined,

          PHARMACY_PROFILE_ALREADY_SUBMITTED_ERROR_CODE
        );
      }

      if (pharmacy.status !== PHARMACY_STATUSES.ACTIVE && !isResubmission) {
        throw httpError(
          HTTP_STATUS.BAD_REQUEST,
          'Pharmacy changes can be submitted for moderation only from active status.',
          undefined,

          PHARMACY_PROFILE_LOCKED_ERROR_CODE
        );
      }

      assertPharmacyProfileRevision(pharmacy, input.expectedRevision);

      const { documents: documentSelections, ...profileFields } = input.changes;

      const resolvedChanges: ResolvedPharmacyProfileUpdate = {
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

      const hasNewChanges = hasModeratedProfileChanges(resolvedChanges);

      const hasExistingPendingChanges = Boolean(
        pharmacy.pendingModeration &&
        Object.keys(pharmacy.pendingModeration).length > 0
      );

      if (!hasNewChanges && !hasExistingPendingChanges) {
        throw httpError(
          HTTP_STATUS.BAD_REQUEST,
          'There are no pharmacy changes to send for moderation.',
          undefined,

          PHARMACY_NO_PENDING_CHANGES_ERROR_CODE
        );
      }

      const pendingModeration = hasNewChanges
        ? buildPendingModerationPayload(
            pharmacy.pendingModeration,
            resolvedChanges,
            pharmacy.location
          )
        : normalizePendingModerationPayload(pharmacy.pendingModeration);

      const updatedPharmacy = await Pharmacy.findOneAndUpdate(
        {
          _id: pharmacy._id,

          status: isResubmission
            ? PHARMACY_STATUSES.ON_MODERATION
            : PHARMACY_STATUSES.ACTIVE,

          ...(isResubmission ? { reviewState: 'changes_requested' } : {}),

          updatedAt: new Date(input.expectedRevision),
        },

        {
          $set: {
            pendingModeration,
            status: PHARMACY_STATUSES.ON_MODERATION,
            reviewState: 'pending',
            updatedBy: userId,
          },

          $unset: {
            statusReason: '',
            reviewFeedback: '',
            reviewedAt: '',
            reviewedBy: '',
          },
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
        ADMIN_AUDIT_ACTIONS.PHARMACY_MODERATION_SUBMITTED,

        safePharmacyEditedSections(
          hasNewChanges ? resolvedChanges : (pharmacy.pendingModeration ?? {})
        ),

        mongoSession,
        auditRequestId
      );

      result = {
        pharmacy: serializePharmacyProfile(
          updatedPharmacy as PharmacyDocument,
          membershipRole
        ),

        message: 'Pharmacy changes were sent for moderation.',
      };
    });
  } finally {
    await mongoSession.endSession();
  }

  if (!result) {
    throw new Error(
      'Pharmacy moderation submission transaction did not commit.'
    );
  }

  return result;
}

//===============================================================

export async function sendMyPharmacyForVerificationService(
  userId: string,
  auditRequestId?: string,
  pharmacyId?: string
): Promise<{ pharmacy: MyPharmacyProfileResponseDto; message: string }> {
  const session = await mongoose.startSession();

  try {
    const updated = await session.withTransaction(async () => {
      const { pharmacy, membershipRole } = await findPharmacyForProfileAccess(
        userId,
        'submit_profile',
        session,
        pharmacyId
      );

      const isResubmission =
        pharmacy.status === PHARMACY_STATUSES.ON_VERIFICATION &&
        pharmacy.reviewState === 'changes_requested';

      if (pharmacy.status !== PHARMACY_STATUSES.NEW && !isResubmission) {
        throw httpError(
          HTTP_STATUS.CONFLICT,
          'Pharmacy profile is already submitted or cannot be verified from its current status.',
          undefined,

          PHARMACY_PROFILE_ALREADY_SUBMITTED_ERROR_CODE
        );
      }

      assertReadyForVerification(pharmacy);

      // Owner identity documents are separate from Pharmacy verification files.
      // Check the canonical owner account, not the submitting manager's identity.
      const ownerDocumentExists = await PharmacyOwnerDocument.exists({
        ownerUserId: pharmacy.ownerId,
      }).session(session);

      if (!ownerDocumentExists) {
        throw httpError(
          HTTP_STATUS.BAD_REQUEST,
          'Upload at least one Owner document before sending the pharmacy for verification.',
          { missingFields: ['ownerDocuments'] },

          PHARMACY_PROFILE_INCOMPLETE_ERROR_CODE
        );
      }

      const saved = await Pharmacy.findOneAndUpdate(
        {
          _id: pharmacy._id,
          status: pharmacy.status,
          updatedAt: pharmacy.updatedAt,

          ...(isResubmission ? { reviewState: 'changes_requested' } : {}),
        },

        {
          $set: {
            status: PHARMACY_STATUSES.ON_VERIFICATION,
            reviewState: 'pending',
            updatedBy: userId,
          },

          $unset: {
            statusReason: '',
            reviewFeedback: '',
            reviewedAt: '',
            reviewedBy: '',
          },
        },

        { new: true, runValidators: true, session }
      );

      if (!saved) throwPharmacyProfileConflict();

      await appendPharmacyOwnerMutationAudit(
        userId,
        pharmacy,
        saved,
        ADMIN_AUDIT_ACTIONS.PHARMACY_MODERATION_SUBMITTED,
        ['verificationSubmission'],
        session,
        auditRequestId
      );

      return {
        pharmacy: serializePharmacyProfile(
          saved as PharmacyDocument,
          membershipRole
        ),
      };
    });
    if (!updated)
      throw new Error('Pharmacy verification submission did not commit.');

    return {
      ...updated,
      message: 'Pharmacy was sent for verification.',
    };
  } finally {
    await session.endSession();
  }
}
