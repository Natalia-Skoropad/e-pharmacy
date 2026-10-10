import mongoose, { type HydratedDocument } from 'mongoose';

import { PHARMACY_STATUSES } from '../constants/auth';
import { HTTP_STATUS } from '../constants/httpStatus';
import { API_MESSAGES } from '../constants/messages';

import {
  ADMIN_AUDIT_ACTIONS,
  ADMIN_AUDIT_ENTITY_TYPES,
  ADMIN_AUDIT_SECTIONS,
} from '../constants/admin-audit';

import { Pharmacy } from '../models/pharmacy.model';
import { User } from '../models/user.model';
import { Order } from '../models/order.model';
import { PHARMACY_OWNER_ACTIVE_ORDER_STATUSES } from '../constants/pharmacy-owner-lifecycle';
import { USER_ROLES, USER_STATUSES } from '../constants/auth';

import type {
  PharmacyEntity,
  PharmacyLocationDraft,
  PharmacyPendingModeration,
  PharmacyProfileResponseDto,
  PharmacyStatus,
} from '../types/pharmacy';

import { httpError } from '../utils/httpError';

import { appendAdminAuditLog } from './admin-audit.service';
import { ensureDefaultPharmacyClient } from './default-pharmacy-client.service';

import { reconcileAttachedPharmacyDocumentStorage } from './pharmacy-document.service';
import { activateNewPharmacyOwnerForPharmacy } from './pharmacy-owner-lifecycle.service';

//===============================================================

function clonePharmacyLocation(
  location?: PharmacyLocationDraft
): PharmacyLocationDraft | undefined {
  if (!location) return undefined;

  return {
    ...(location.address !== undefined ? { address: location.address } : {}),
    ...(location.settlement !== undefined
      ? { settlement: location.settlement }
      : {}),
    ...(location.region !== undefined ? { region: location.region } : {}),
    ...(location.countryCode !== undefined
      ? { countryCode: location.countryCode }
      : {}),
    ...(location.geo !== undefined
      ? {
          geo: {
            type: 'Point',
            coordinates: [
              location.geo.coordinates[0],
              location.geo.coordinates[1],
            ],
          },
        }
      : {}),
  };
}

//===============================================================

function normalizePendingModeration(
  current: PharmacyPendingModeration | undefined
): PharmacyPendingModeration | undefined {
  if (!current) return undefined;

  return {
    ...(current.name !== undefined ? { name: current.name } : {}),
    ...(current.location
      ? { location: clonePharmacyLocation(current.location) }
      : {}),
    ...(current.phone !== undefined ? { phone: current.phone } : {}),
    ...(current.email !== undefined ? { email: current.email } : {}),
    ...(current.workingHours !== undefined
      ? { workingHours: current.workingHours }
      : {}),
    ...(current.imageUrl !== undefined ? { imageUrl: current.imageUrl } : {}),
    ...(current.description !== undefined
      ? { description: current.description }
      : {}),
    ...(current.documents !== undefined
      ? { documents: [...current.documents] }
      : {}),
    ...(current.bankDetails !== undefined
      ? { bankDetails: { ...current.bankDetails } }
      : {}),
  };
}

//===============================================================

function hasCompleteBankDetails(
  bankDetails?: PharmacyEntity['bankDetails']
): boolean {
  return Boolean(
    bankDetails?.recipientName &&
    bankDetails.taxId &&
    bankDetails.iban &&
    bankDetails.bankName &&
    bankDetails.receiptEmail &&
    bankDetails.paymentPurpose
  );
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
    ...(pharmacy.statusReason ? { statusReason: pharmacy.statusReason } : {}),
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

type UpdatePharmacyStatusInput = {
  status: PharmacyStatus;
  reason?: string;
};

export type RequestPharmacyCorrectionsInput = {
  feedback: string;
  expectedRevision: string;
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

async function assertPharmacyHasNoActiveOrders(
  pharmacyId: mongoose.Types.ObjectId,
  session: mongoose.ClientSession
): Promise<void> {
  const activeOrders = await Order.countDocuments({
    pharmacyId,
    status: { $in: PHARMACY_OWNER_ACTIVE_ORDER_STATUSES },
  }).session(session);

  if (activeOrders > 0) {
    throw httpError(
      HTTP_STATUS.CONFLICT,
      'A pharmacy with unfinished orders cannot be blocked.'
    );
  }
}

//=================================================================

/** Same-status moderation decision; owner-visible feedback, no publication. */
export async function requestPharmacyCorrectionsByAdminService(
  pharmacyId: string,
  input: RequestPharmacyCorrectionsInput,
  adminUserId: string,
  auditRequestId?: string
): Promise<PharmacyProfileResponseDto> {
  const session = await mongoose.startSession();

  try {
    const updated = await session.withTransaction(async () => {
      const pharmacy = await Pharmacy.findById(pharmacyId).session(session);

      if (!pharmacy) {
        throw httpError(HTTP_STATUS.NOT_FOUND, API_MESSAGES.PHARMACY_NOT_FOUND);
      }
      if (
        pharmacy.status !== PHARMACY_STATUSES.ON_VERIFICATION &&
        pharmacy.status !== PHARMACY_STATUSES.ON_MODERATION
      ) {
        throw httpError(
          HTTP_STATUS.CONFLICT,
          'Pharmacy is not awaiting review.'
        );
      }
      if (pharmacy.updatedAt.toISOString() !== input.expectedRevision) {
        throw httpError(
          HTTP_STATUS.CONFLICT,
          'Pharmacy review has changed. Refresh and retry.'
        );
      }

      const feedback = input.feedback.trim();

      const updatedPharmacy = await Pharmacy.findOneAndUpdate(
        {
          _id: pharmacy._id,
          status: pharmacy.status,
          updatedAt: new Date(input.expectedRevision),
          reviewState: { $ne: 'changes_requested' },
        },
        {
          $set: {
            reviewState: 'changes_requested',
            reviewFeedback: feedback,
            reviewedAt: new Date(),
            reviewedBy: adminUserId,
            updatedBy: adminUserId,
          },
        },
        { new: true, runValidators: true, session }
      );

      if (!updatedPharmacy) {
        throw httpError(
          HTTP_STATUS.CONFLICT,
          'Review changed while requesting corrections.'
        );
      }
      // Feedback is owner-visible; never include bank details/documents in audit.
      if (auditRequestId) {
        await appendAdminAuditLog({
          actorUserId: adminUserId,
          action: ADMIN_AUDIT_ACTIONS.PHARMACY_CORRECTIONS_REQUESTED,
          section: ADMIN_AUDIT_SECTIONS.PHARMACIES,
          entityType: ADMIN_AUDIT_ENTITY_TYPES.PHARMACY,
          entityId: String(updatedPharmacy._id),
          entityLabel: updatedPharmacy.name,
          scopeEntityType: ADMIN_AUDIT_ENTITY_TYPES.PHARMACY_OWNER,
          scopeEntityId: String(updatedPharmacy.ownerId),
          before: { reviewState: pharmacy.reviewState ?? 'pending' },
          after: { reviewState: 'changes_requested' },
          changedFields: ['reviewState'],
          reason: feedback,
          requestId: auditRequestId,
          session,
        });
      }

      return updatedPharmacy;
    });
    if (!updated)
      throw new Error('Request corrections transaction did not commit.');

    return serializePharmacyProfile(updated);
  } finally {
    await session.endSession();
  }
}

//=================================================================

export async function updatePharmacyStatusByAdminService(
  pharmacyId: string,
  input: UpdatePharmacyStatusInput,
  adminUserId: string,
  auditRequestId?: string
) {
  const session = await mongoose.startSession();

  try {
    const updatedPharmacy = await session.withTransaction(async () => {
      const pharmacy = await Pharmacy.findById(pharmacyId).session(session);

      if (!pharmacy) {
        throw httpError(HTTP_STATUS.NOT_FOUND, API_MESSAGES.PHARMACY_NOT_FOUND);
      }

      const previousStatus = pharmacy.status;
      // Only Admin approval or blocking are transitions here. A review decision
      // with no status change uses /review/corrections, not PATCH status.
      if (previousStatus === input.status) return pharmacy;
      if (
        input.status !== PHARMACY_STATUSES.ACTIVE &&
        input.status !== PHARMACY_STATUSES.BLOCKED
      ) {
        throw httpError(
          HTTP_STATUS.CONFLICT,
          'This pharmacy status transition is not allowed.'
        );
      }
      if (previousStatus === PHARMACY_STATUSES.BLOCKED) {
        // Explicit reactivation procedure is reserved for Stage 14.3.
        throw httpError(
          HTTP_STATUS.CONFLICT,
          'Blocked pharmacies require a separate reactivation review.'
        );
      }
      if (input.status === PHARMACY_STATUSES.ACTIVE) {
        if (
          previousStatus !== PHARMACY_STATUSES.ON_VERIFICATION &&
          previousStatus !== PHARMACY_STATUSES.ON_MODERATION
        ) {
          throw httpError(
            HTTP_STATUS.CONFLICT,
            'Pharmacy is not ready for approval.'
          );
        }
        if (pharmacy.reviewState === 'changes_requested') {
          throw httpError(
            HTTP_STATUS.CONFLICT,
            'Owner must resubmit corrections before approval.'
          );
        }

        await assertPharmacyOwnerCanOperate(pharmacy.ownerId, session);
      } else {
        if (!input.reason?.trim()) {
          throw httpError(
            HTTP_STATUS.BAD_REQUEST,
            'Blocking requires a reason.'
          );
        }

        await assertPharmacyHasNoActiveOrders(pharmacy._id, session);
      }

      const nextUpdate: Record<string, unknown> = {
        status: input.status,
        updatedBy: adminUserId,
      };

      const unsetFields: Record<string, string> = {};

      if (input.status === PHARMACY_STATUSES.ACTIVE) {
        const pendingModeration =
          normalizePendingModeration(pharmacy.pendingModeration) ?? {};

        const { location, bankDetails, ...pendingRootFields } =
          pendingModeration;

        const approvedAt = new Date();

        for (const [key, value] of Object.entries(pendingRootFields)) {
          if (value === null) unsetFields[key] = '';
          else if (value !== undefined) nextUpdate[key] = value;
        }

        if (location !== undefined) {
          nextUpdate.location = clonePharmacyLocation(location);
        } else if (!pharmacy.location?.countryCode) {
          nextUpdate['location.countryCode'] = 'UA';
        }

        if (bankDetails) {
          for (const [key, value] of Object.entries(bankDetails)) {
            const path = `bankDetails.${key}`;
            if (value === null) unsetFields[path] = '';
            else if (value !== undefined) nextUpdate[path] = value;
          }
        }

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
      } else {
        // Blocking retains historical approval/activation timestamps and any
        // pending draft; neither makes a blocked pharmacy operational.
        nextUpdate.statusReason = input.reason?.trim();
        unsetFields.reviewState = '';
        unsetFields.reviewFeedback = '';
        unsetFields.reviewedAt = '';
        unsetFields.reviewedBy = '';
      }

      const updateQuery: Record<string, unknown> = { $set: nextUpdate };
      if (Object.keys(unsetFields).length > 0) {
        updateQuery.$unset = unsetFields;
      }

      const updated = await Pharmacy.findByIdAndUpdate(
        pharmacyId,
        updateQuery,
        {
          new: true,
          runValidators: true,
          session,
        }
      );

      if (!updated) {
        throw httpError(HTTP_STATUS.NOT_FOUND, API_MESSAGES.PHARMACY_NOT_FOUND);
      }

      await reconcileAttachedPharmacyDocumentStorage(
        updated._id,
        updated.documents ?? [],
        updated.pendingModeration?.documents,
        session
      );

      if (input.status === PHARMACY_STATUSES.ACTIVE) {
        const defaultClient = await ensureDefaultPharmacyClient(
          updated._id,
          adminUserId,
          session
        );

        if (!defaultClient) {
          throw new Error(
            'Default pharmacy client could not be created during activation.'
          );
        }

        await activateNewPharmacyOwnerForPharmacy(
          updated,
          adminUserId,
          auditRequestId,
          session
        );
      }

      if (auditRequestId && previousStatus !== updated.status) {
        await appendAdminAuditLog({
          actorUserId: adminUserId,
          action: ADMIN_AUDIT_ACTIONS.PHARMACY_STATUS_CHANGED,
          section: ADMIN_AUDIT_SECTIONS.PHARMACIES,
          entityType: ADMIN_AUDIT_ENTITY_TYPES.PHARMACY,
          entityId: String(updated._id),
          entityLabel: updated.name,
          scopeEntityType: ADMIN_AUDIT_ENTITY_TYPES.PHARMACY_OWNER,
          scopeEntityId: String(updated.ownerId),
          before: { status: previousStatus },
          after: { status: updated.status },
          changedFields: ['status'],
          ...(input.reason?.trim() ? { reason: input.reason.trim() } : {}),
          requestId: auditRequestId,
          session,
        });
      }

      return updated;
    });

    if (!updatedPharmacy) {
      throw httpError(HTTP_STATUS.NOT_FOUND, API_MESSAGES.PHARMACY_NOT_FOUND);
    }

    return serializePharmacyProfile(updatedPharmacy);
  } finally {
    await session.endSession();
  }
}
