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

import type {
  PharmacyEntity,
  PharmacyProfileResponseDto,
  PharmacyStatus,
} from '../types/pharmacy';

import { httpError } from '../utils/httpError';

import { appendAdminAuditLog } from './admin-audit.service';
import { ensureDefaultPharmacyClient } from './default-pharmacy-client.service';

import { reconcileAttachedPharmacyDocumentStorage } from './pharmacy-document.service';
import { activateNewPharmacyOwnerForPharmacy } from './pharmacy-owner-lifecycle.service';

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
    address: pharmacy.address,
    ...(pharmacy.city ? { city: pharmacy.city } : {}),
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
    ...(pharmacy.pendingModeration
      ? { pendingModeration: pharmacy.pendingModeration }
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

//===============================================================

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

      if (
        input.status === PHARMACY_STATUSES.ON_VERIFICATION &&
        (pharmacy.status === PHARMACY_STATUSES.ACTIVE || pharmacy.approvedAt)
      ) {
        throw httpError(
          HTTP_STATUS.BAD_REQUEST,
          'Activated pharmacy cannot be returned to On verification.'
        );
      }

      if (
        input.status === PHARMACY_STATUSES.NEW &&
        (pharmacy.status === PHARMACY_STATUSES.ON_VERIFICATION ||
          pharmacy.status === PHARMACY_STATUSES.ON_MODERATION) &&
        !input.reason?.trim()
      ) {
        throw httpError(
          HTTP_STATUS.BAD_REQUEST,
          'Reason is required when returning pharmacy to New status.'
        );
      }

      const nextUpdate: Record<string, unknown> = {
        status: input.status,
        updatedBy: adminUserId,
      };

      const unsetFields: Record<string, string> = {};

      if (input.status === PHARMACY_STATUSES.ACTIVE) {
        const pendingModeration = pharmacy.pendingModeration ?? {};
        const { bankDetails, ...pendingRootFields } = pendingModeration;
        const approvedAt = new Date();

        for (const [key, value] of Object.entries(pendingRootFields)) {
          if (value === null) unsetFields[key] = '';
          else if (value !== undefined) nextUpdate[key] = value;
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
      } else if (input.status === PHARMACY_STATUSES.NEW) {
        nextUpdate.approvedBy = undefined;
        nextUpdate.approvedAt = undefined;
        nextUpdate.statusReason = input.reason?.trim();
        unsetFields.pendingModeration = '';
      } else {
        nextUpdate.approvedBy = undefined;
        nextUpdate.approvedAt = undefined;
        if (input.reason?.trim()) {
          nextUpdate.statusReason = input.reason.trim();
        } else {
          unsetFields.statusReason = '';
        }
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
