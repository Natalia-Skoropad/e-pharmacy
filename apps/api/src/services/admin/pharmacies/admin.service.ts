import mongoose, { type HydratedDocument } from 'mongoose';

import { PHARMACY_STATUSES } from '../../../constants/auth/auth';
import { HTTP_STATUS } from '../../../constants/http/httpStatus';
import { API_MESSAGES } from '../../../constants/shared/messages';
import { USER_ROLES, USER_STATUSES } from '../../../constants/auth/auth';

import {
  ADMIN_AUDIT_ACTIONS,
  ADMIN_AUDIT_ENTITY_TYPES,
  ADMIN_AUDIT_SECTIONS,
  type AdminAuditAction,
} from '../../../constants/admin/audit/admin-audit';

import { Pharmacy } from '../../../models/pharmacies/pharmacy.model';
import { AdminAuditLog } from '../../../models/audit/adminAuditLog.model';
import { User } from '../../../models/accounts/user.model';
import { PharmacyOwnerDocument } from '../../../models/owners/pharmacyOwnerDocument.model';

import type {
  PharmacyEntity,
  PharmacyPendingModeration,
  PharmacyProfileResponseDto,
  PharmacyStatus,
} from '../../../types/pharmacies/pharmacy';

import { httpError } from '../../../utils/http/httpError';

import { appendAdminAuditLog } from '../audit/admin-audit-write.service';
import { ensureDefaultPharmacyClient } from '../../clients/default-pharmacy-client.service';
import { activateNewPharmacyOwnerForPharmacy } from '../../owners/pharmacy-owner-lifecycle.service';

import { reconcileAttachedPharmacyDocumentStorage } from '../../pharmacies/pharmacy-document.service';
import { hasCompleteBankDetails } from '../../pharmacies/bank-details';
import { missingRequiredModerationFields } from '../../pharmacies/pharmacy-moderation-readiness';

import {
  clonePharmacyLocation,
  clonePendingModerationFields,
} from '../../pharmacies/pharmacy-location';

import {
  ensurePharmacyPaymentUniqueIndex,
  syncPharmacyPaymentIdentifiers,
} from '../../pharmacies/pharmacy-payment-uniqueness.service';

//===============================================================

function normalizePendingModeration(
  current: PharmacyPendingModeration | undefined
): PharmacyPendingModeration | undefined {
  // Admin moderation deliberately returns undefined for absent pending data;
  // Owner draft normalization deliberately returns an empty patch instead.
  if (!current) return undefined;

  return clonePendingModerationFields(current);
}

//===============================================================

function serializePharmacyProfile(
  pharmacy: HydratedDocument<PharmacyEntity>
): PharmacyProfileResponseDto {
  return {
    id: String(pharmacy._id),
    name: pharmacy.name,

    ...(pharmacy.location
      ? { location: clonePharmacyLocation(pharmacy.location) }
      : {}),

    ...(pharmacy.phone ? { phone: pharmacy.phone } : {}),
    ...(pharmacy.email ? { email: pharmacy.email } : {}),
    ...(pharmacy.workingHours ? { workingHours: pharmacy.workingHours } : {}),
    ...(pharmacy.bankDetails ? { bankDetails: pharmacy.bankDetails } : {}),

    bankTransferAvailable: hasCompleteBankDetails(pharmacy.bankDetails),
    documents: pharmacy.documents ?? [],
    status: pharmacy.status,
    rating: pharmacy.rating ?? 0,

    ...(pharmacy.imageUrl ? { imageUrl: pharmacy.imageUrl } : {}),
    ...(pharmacy.description ? { description: pharmacy.description } : {}),

    ...(pharmacy.shortDescription
      ? { shortDescription: pharmacy.shortDescription }
      : {}),

    ...(pharmacy.statusReason ? { statusReason: pharmacy.statusReason } : {}),
    ...(pharmacy.blockSource ? { blockSource: pharmacy.blockSource } : {}),
    ...(pharmacy.reviewState ? { reviewState: pharmacy.reviewState } : {}),

    ...(pharmacy.reviewFeedback
      ? { reviewFeedback: pharmacy.reviewFeedback }
      : {}),

    ...(pharmacy.reviewedAt
      ? { reviewedAt: pharmacy.reviewedAt.toISOString() }
      : {}),

    ...(pharmacy.reviewedBy ? { reviewedBy: String(pharmacy.reviewedBy) } : {}),

    ...(pharmacy.pendingModeration
      ? {
          pendingModeration: normalizePendingModeration(
            pharmacy.pendingModeration
          ),
        }
      : {}),

    reviewsCount: pharmacy.reviewsCount ?? 0,
    updatedAt: pharmacy.updatedAt.toISOString(),
  };
}

//===============================================================

export type PharmacyModerationDecisionInput = {
  action:
    | 'approve'
    | 'request_corrections'
    | 'block'
    | 'review_reactivation'
    | 'reject_reactivation';

  reason: string;
  expectedRevision: string;
  clientRequestId?: string;
};

type UpdatePharmacyStatusInput = {
  status: PharmacyStatus;
  reason: string;
  expectedRevision: string;
  clientRequestId?: string;
};

export type RequestPharmacyCorrectionsInput = {
  feedback: string;
  expectedRevision: string;
  clientRequestId?: string;
};

//===============================================================

async function assertPharmacyOwnerCanOperate(
  ownerId: PharmacyEntity['ownerId'],
  session: mongoose.ClientSession
): Promise<void> {
  const owner = await User.findOne({
    _id: ownerId,
    role: USER_ROLES.PHARMACY,
  }).session(session);

  if (!owner || owner.status === USER_STATUSES.BLOCKED) {
    throw httpError(
      HTTP_STATUS.CONFLICT,
      'A blocked or missing pharmacy owner cannot have a pharmacy activated.'
    );
  }
}

//===============================================================

/** All administrator moderation decisions share one transaction and one transition policy. */
export async function decidePharmacyModerationByAdminService(
  pharmacyId: string,
  input: PharmacyModerationDecisionInput,
  adminUserId: string,
  auditRequestId?: string
): Promise<PharmacyProfileResponseDto> {
  const reason = input.reason?.trim();

  if (!reason || reason.length > 1000) {
    throw httpError(
      HTTP_STATUS.BAD_REQUEST,
      'A moderation reason is required.'
    );
  }

  const expectedDate = new Date(input.expectedRevision);

  if (Number.isNaN(expectedDate.getTime())) {
    throw httpError(
      HTTP_STATUS.BAD_REQUEST,
      'A valid expectedRevision is required.'
    );
  }

  if (input.clientRequestId && !/^[\w.-]{8,128}$/.test(input.clientRequestId)) {
    throw httpError(HTTP_STATUS.BAD_REQUEST, 'Invalid idempotency key.');
  }

  if (
    ![
      'approve',
      'request_corrections',
      'block',
      'review_reactivation',
      'reject_reactivation',
    ].includes(input.action)
  ) {
    throw httpError(HTTP_STATUS.BAD_REQUEST, 'Unknown moderation decision.');
  }

  // Defense in depth; route also checks pharmacies.moderate permissions.
  const actor = await User.findOne({
    _id: adminUserId,
    role: USER_ROLES.ADMIN,
  });

  if (!actor || actor.status === USER_STATUSES.BLOCKED) {
    throw httpError(
      HTTP_STATUS.FORBIDDEN,
      'An active administrator is required.'
    );
  }

  const mutationQuery = input.clientRequestId
    ? {
        entityType: ADMIN_AUDIT_ENTITY_TYPES.PHARMACY,
        entityId: pharmacyId,
        mutationKey: input.clientRequestId,
      }
    : null;

  const replay = async (): Promise<PharmacyProfileResponseDto | null> => {
    if (!mutationQuery) return null;

    const audit = await AdminAuditLog.findOne(mutationQuery).lean();

    if (!audit) return null;

    // Same key with different action/payload is not a retry.
    if (
      audit.actorUserId.toString() !== adminUserId ||
      audit.before.revision !== input.expectedRevision ||
      audit.before.moderationAction !== input.action ||
      audit.reason !== reason
    ) {
      throw httpError(
        HTTP_STATUS.CONFLICT,
        'Idempotency key was used for another decision.'
      );
    }

    const current = await Pharmacy.findById(pharmacyId);

    if (!current || current.updatedAt.toISOString() !== audit.after.revision) {
      throw httpError(
        HTTP_STATUS.CONFLICT,
        'Decision was applied, but the pharmacy has changed since then. Refresh.'
      );
    }

    return serializePharmacyProfile(current);
  };

  const earlier = await replay();

  if (earlier) return earlier;

  await ensurePharmacyPaymentUniqueIndex();

  const session = await mongoose.startSession();

  try {
    const updated = await session.withTransaction(async () => {
      const pharmacy = await Pharmacy.findById(pharmacyId).session(session);

      if (!pharmacy)
        throw httpError(HTTP_STATUS.NOT_FOUND, API_MESSAGES.PHARMACY_NOT_FOUND);

      if (pharmacy.updatedAt.toISOString() !== input.expectedRevision) {
        throw httpError(
          HTTP_STATUS.CONFLICT,
          'Pharmacy review has changed. Refresh and retry.'
        );
      }

      const previousStatus = pharmacy.status;

      const isVerification =
        previousStatus === PHARMACY_STATUSES.ON_VERIFICATION;

      const isModeration = previousStatus === PHARMACY_STATUSES.ON_MODERATION;
      const isBlocked = previousStatus === PHARMACY_STATUSES.BLOCKED;

      const isReactivation =
        previousStatus === PHARMACY_STATUSES.ON_REACTIVATION;

      const nextUpdate: Record<string, unknown> = { updatedBy: adminUserId };
      const unsetFields: Record<string, string> = {};

      let action: AdminAuditAction =
        ADMIN_AUDIT_ACTIONS.PHARMACY_STATUS_CHANGED;

      let nextStatus: PharmacyStatus = previousStatus;
      let nextReviewState: string = pharmacy.reviewState ?? 'pending';

      const priorReviewState = nextReviewState;

      switch (input.action) {
        case 'request_corrections': {
          if (
            (!isVerification && !isModeration && !isReactivation) ||
            pharmacy.reviewState !== 'pending'
          ) {
            throw httpError(
              HTTP_STATUS.CONFLICT,
              'Pharmacy is not awaiting review.'
            );
          }

          // Repeated corrections are permitted with a fresh revision and produce an audit event.
          action = ADMIN_AUDIT_ACTIONS.PHARMACY_CORRECTIONS_REQUESTED;
          nextReviewState = 'changes_requested';
          nextUpdate.reviewState = nextReviewState;
          nextUpdate.reviewFeedback = reason;
          nextUpdate.reviewedAt = new Date();
          nextUpdate.reviewedBy = adminUserId;

          break;
        }

        case 'approve': {
          if (
            (!isVerification && !isModeration) ||
            pharmacy.reviewState === 'changes_requested'
          ) {
            throw httpError(
              HTTP_STATUS.CONFLICT,
              'Pharmacy is not ready for approval.'
            );
          }

          await assertPharmacyOwnerCanOperate(pharmacy.ownerId, session);

          nextStatus = PHARMACY_STATUSES.ACTIVE;
          nextUpdate.status = nextStatus;

          const pending =
            normalizePendingModeration(pharmacy.pendingModeration) ?? {};

          const { location, bankDetails, ...pendingRootFields } = pending;

          for (const [key, value] of Object.entries(pendingRootFields)) {
            if (value === null) unsetFields[key] = '';
            else if (value !== undefined) nextUpdate[key] = value;
          }

          if (location !== undefined)
            nextUpdate.location = clonePharmacyLocation(location);
          else if (!pharmacy.location?.countryCode)
            nextUpdate['location.countryCode'] = 'UA';

          if (bankDetails) {
            for (const [key, value] of Object.entries(bankDetails)) {
              const path = `bankDetails.${key}`;

              if (value === null) unsetFields[path] = '';
              else if (value !== undefined) nextUpdate[path] = value;
            }
          }

          const approvedAt = new Date();

          Object.assign(nextUpdate, {
            approvedBy: adminUserId,
            approvedAt,
            activatedAt: pharmacy.activatedAt ?? approvedAt,
          });

          unsetFields.pendingModeration = '';
          unsetFields.statusReason = '';
          unsetFields.reviewState = '';
          unsetFields.reviewFeedback = '';
          unsetFields.reviewedAt = '';
          unsetFields.reviewedBy = '';
          break;
        }
        case 'block': {
          if (
            !isVerification &&
            !isModeration &&
            !isReactivation &&
            previousStatus !== PHARMACY_STATUSES.ACTIVE
          ) {
            throw httpError(
              HTTP_STATUS.CONFLICT,
              'This pharmacy cannot be blocked from its current status.'
            );
          }

          // Emergency Admin block must remain possible even with unfinished orders.
          // Existing orders still require supervised fulfillment/refunds.

          nextStatus = PHARMACY_STATUSES.BLOCKED;
          nextUpdate.status = nextStatus;
          nextUpdate.statusReason = reason;
          nextUpdate.blockSource = 'admin_blocked';
          unsetFields.reviewState = '';
          unsetFields.reviewFeedback = '';
          unsetFields.reviewedAt = '';
          unsetFields.reviewedBy = '';

          // Preserve historical activation and drafts; blocked must never be operational.
          break;
        }

        case 'reject_reactivation': {
          if (!isReactivation || pharmacy.reviewState !== 'pending') {
            throw httpError(
              HTTP_STATUS.CONFLICT,
              'No pending reactivation request to reject.'
            );
          }

          nextStatus = PHARMACY_STATUSES.BLOCKED;
          nextUpdate.status = nextStatus;
          nextUpdate.statusReason = reason;
          nextReviewState = 'pending';
          unsetFields.reviewState = '';
          unsetFields.reviewFeedback = '';
          unsetFields.reviewedAt = '';
          unsetFields.reviewedBy = '';
          action = ADMIN_AUDIT_ACTIONS.PHARMACY_REACTIVATION_REJECTED;

          break;
        }

        case 'review_reactivation': {
          if (
            !(isReactivation && pharmacy.reviewState === 'pending') &&
            !(isBlocked && pharmacy.blockSource === 'admin_blocked')
          ) {
            throw httpError(
              HTTP_STATUS.CONFLICT,
              'Reactivation requires a pending request or an administrator-issued block.'
            );
          }

          await assertPharmacyOwnerCanOperate(pharmacy.ownerId, session);

          const missing = missingRequiredModerationFields(
            pharmacy,
            pharmacy.pendingModeration ?? {}
          );

          if (missing.length)
            throw httpError(
              HTTP_STATUS.CONFLICT,
              'Complete required pharmacy fields before reactivation.',
              { missingFields: missing }
            );

          const ownerDocument = await PharmacyOwnerDocument.exists({
            ownerUserId: pharmacy.ownerId,
          }).session(session);

          if (!ownerDocument)
            throw httpError(
              HTTP_STATUS.CONFLICT,
              'Pharmacy owner documents are required for reactivation.'
            );

          nextStatus = pharmacy.activatedAt
            ? PHARMACY_STATUSES.ACTIVE
            : PHARMACY_STATUSES.ON_VERIFICATION;

          nextUpdate.status = nextStatus;

          if (isReactivation) {
            // Apply the exact frozen proposed version reviewed by Admin, never a later edit.
            const pending =
              normalizePendingModeration(pharmacy.pendingModeration) ?? {};

            const { location, bankDetails, ...rootFields } = pending;

            for (const [key, value] of Object.entries(rootFields)) {
              if (value === null) unsetFields[key] = '';
              else if (value !== undefined) nextUpdate[key] = value;
            }

            if (location !== undefined)
              nextUpdate.location = clonePharmacyLocation(location);

            if (bankDetails) {
              for (const [key, value] of Object.entries(bankDetails)) {
                const path = `bankDetails.${key}`;
                if (value === null) unsetFields[path] = '';
                else if (value !== undefined) nextUpdate[path] = value;
              }
            }

            unsetFields.pendingModeration = '';
          }

          if (nextStatus === PHARMACY_STATUSES.ON_VERIFICATION) {
            nextUpdate.reviewState = 'pending';
            nextReviewState = 'pending';
          } else {
            unsetFields.reviewState = '';
            nextReviewState = 'pending';
          }

          unsetFields.statusReason = '';
          unsetFields.blockSource = '';
          unsetFields.reviewFeedback = '';
          unsetFields.reviewedAt = '';
          unsetFields.reviewedBy = '';
          action = ADMIN_AUDIT_ACTIONS.PHARMACY_REACTIVATION_REVIEWED;

          break;
        }
      }

      // Strict CAS, even for same-status corrections; timestamp is monotonic.
      const revision = new Date(
        Math.max(Date.now(), pharmacy.updatedAt.getTime() + 1)
      );

      nextUpdate.updatedAt = revision;

      const updateQuery: Record<string, unknown> = { $set: nextUpdate };

      if (Object.keys(unsetFields).length) updateQuery.$unset = unsetFields;

      const saved = await Pharmacy.findOneAndUpdate(
        { _id: pharmacy._id, status: previousStatus, updatedAt: expectedDate },
        updateQuery,
        { new: true, runValidators: true, session, timestamps: false }
      );

      if (!saved)
        throw httpError(
          HTTP_STATUS.CONFLICT,
          'Pharmacy review has changed. Refresh and retry.'
        );

      if (
        input.action === 'approve' ||
        (input.action === 'review_reactivation' && isReactivation)
      ) {
        await syncPharmacyPaymentIdentifiers(saved, session);

        await reconcileAttachedPharmacyDocumentStorage(
          saved._id,
          saved.documents ?? [],
          saved.pendingModeration?.documents,
          session
        );

        // Only initial activation needs a default client and owner lifecycle event.
        if (!pharmacy.activatedAt && nextStatus === PHARMACY_STATUSES.ACTIVE) {
          const defaultClient = await ensureDefaultPharmacyClient(
            saved._id,
            adminUserId,
            session
          );

          if (!defaultClient)
            throw new Error(
              'Default pharmacy client could not be created during activation.'
            );

          await activateNewPharmacyOwnerForPharmacy(
            saved,
            adminUserId,

            auditRequestId ??
              input.clientRequestId ??
              new mongoose.Types.ObjectId().toHexString(),

            session
          );
        }
      }

      if (
        input.action === 'review_reactivation' &&
        nextStatus === PHARMACY_STATUSES.ACTIVE
      ) {
        // Defensive check for legacy clients without a default account.
        // No owner auto-activation or approval of a pending draft occurs here.
        const defaultClient = await ensureDefaultPharmacyClient(
          saved._id,
          adminUserId,
          session
        );

        if (!defaultClient)
          throw new Error(
            'Default pharmacy client could not be resolved during reactivation.'
          );
      }

      const afterReviewState = saved.reviewState ?? 'pending';

      const pendingSectionLabels: Record<string, string> = {
        bankDetails: 'paymentSettings',
        documents: 'verificationDocuments',
        imageUrl: 'profileImage',
        location: 'location',
      };

      const publishedSections =
        input.action === 'approve'
          ? Object.keys(
              normalizePendingModeration(pharmacy.pendingModeration) ?? {}
            )
              .map((key) => pendingSectionLabels[key] ?? key)
              .sort()
          : [];

      const changedFields = ['revision', 'moderationAction'];

      if (saved.status !== previousStatus) changedFields.push('status');

      if (
        afterReviewState !== priorReviewState ||
        input.action === 'request_corrections'
      )
        changedFields.push('reviewState');

      if (publishedSections.length) changedFields.push('publishedSections');

      await appendAdminAuditLog({
        actorUserId: adminUserId,
        action,
        section: ADMIN_AUDIT_SECTIONS.PHARMACIES,
        entityType: ADMIN_AUDIT_ENTITY_TYPES.PHARMACY,
        entityId: String(saved._id),
        entityLabel: saved.name,
        scopeEntityType: ADMIN_AUDIT_ENTITY_TYPES.PHARMACY_OWNER,
        scopeEntityId: String(saved.ownerId),

        before: {
          status: previousStatus,
          reviewState: priorReviewState,
          blockSource: pharmacy.blockSource ?? null,
          revision: input.expectedRevision,
          moderationAction: input.action,
          publishedSections: [] as string[],
        },

        after: {
          status: saved.status,
          reviewState: afterReviewState,
          blockSource: saved.blockSource ?? null,
          revision: saved.updatedAt.toISOString(),
          moderationAction: input.action,
          publishedSections,
        },

        changedFields,
        reason,

        requestId:
          auditRequestId ??
          input.clientRequestId ??
          new mongoose.Types.ObjectId().toHexString(),

        ...(input.clientRequestId
          ? { mutationKey: input.clientRequestId }
          : {}),

        session,
      });

      return saved;
    });

    if (!updated)
      throw new Error('Moderation decision transaction did not commit.');

    return serializePharmacyProfile(updated);
  } catch (error) {
    // Concurrent duplicate requests may race the unique idempotency index;
    // respond with the result of the already committed decision when possible.
    if (input.clientRequestId) {
      const repeated = await replay();

      if (repeated) return repeated;
    }

    throw error;
  } finally {
    await session.endSession();
  }
}

//===============================================================

export async function requestPharmacyCorrectionsByAdminService(
  pharmacyId: string,
  input: RequestPharmacyCorrectionsInput,
  adminUserId: string,
  auditRequestId?: string
): Promise<PharmacyProfileResponseDto> {
  return decidePharmacyModerationByAdminService(
    pharmacyId,

    {
      action: 'request_corrections',
      reason: input.feedback,
      expectedRevision: input.expectedRevision,
      clientRequestId: input.clientRequestId,
    },

    adminUserId,
    auditRequestId
  );
}

//===============================================================

export async function updatePharmacyStatusByAdminService(
  pharmacyId: string,
  input: UpdatePharmacyStatusInput,
  adminUserId: string,
  auditRequestId?: string
): Promise<PharmacyProfileResponseDto> {
  return decidePharmacyModerationByAdminService(
    pharmacyId,

    {
      action: input.status === PHARMACY_STATUSES.BLOCKED ? 'block' : 'approve',
      reason: input.reason,
      expectedRevision: input.expectedRevision,
      clientRequestId: input.clientRequestId,
    },

    adminUserId,
    auditRequestId
  );
}
