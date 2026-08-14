import { PHARMACY_STATUSES, USER_ROLES } from '../constants/auth';
import { HTTP_STATUS } from '../constants/httpStatus';
import { API_MESSAGES } from '../constants/messages';

import { Pharmacy } from '../models/pharmacy.model';
import { User } from '../models/user.model';
import type { CreatePharmacyUserInput } from '../schemas/auth.schema';

import mongoose, { type HydratedDocument } from 'mongoose';

import type {
  PharmacyEntity,
  PharmacyProfileResponseDto,
  PharmacyStatus,
} from '../types/pharmacy';

import { httpError } from '../utils/httpError';
import { ensureDefaultPharmacyClient } from './default-pharmacy-client.service';

import {
  isDuplicateEmailError,
  isDuplicatePhoneError,
} from '../utils/mongoError';

import { hashPassword } from '../utils/password';
import { claimRegistrationPharmacyDocuments } from './pharmacy-document.service';

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

export async function createPharmacyUserByAdminService(
  input: CreatePharmacyUserInput,
  adminUserId: string
) {
  const phone = input.phone.trim();
  const existingUserWithEmail = await User.exists({ email: input.email });

  if (existingUserWithEmail) {
    throw httpError(HTTP_STATUS.CONFLICT, API_MESSAGES.EMAIL_IN_USE);
  }

  const existingUserWithPhone = await User.exists({ phone });

  if (existingUserWithPhone) {
    throw httpError(HTTP_STATUS.CONFLICT, API_MESSAGES.PHONE_IN_USE);
  }

  const hashedPassword = await hashPassword(input.password);
  const session = await mongoose.startSession();

  try {
    const pharmacy = await session.withTransaction(async () => {
      const [user] = await User.create(
        [
          {
            name: input.name,
            email: input.email,
            password: hashedPassword,
            role: USER_ROLES.PHARMACY,
            phone,
            address: input.address,
            createdBy: adminUserId,
          },
        ],
        { session }
      );

      const [createdPharmacy] = await Pharmacy.create(
        [
          {
            ownerId: user._id,
            managerUserIds: [],
            name: input.pharmacyName ?? user.name,
            address: user.address ?? 'Address pending verification',
            phone: user.phone,
            email: user.email,
            documents: [],
            status: PHARMACY_STATUSES.NEW,
            createdBy: adminUserId,
          },
        ],
        { session }
      );

      const documents = await claimRegistrationPharmacyDocuments(
        input.pharmacyDocuments ?? [],
        createdPharmacy._id,
        user._id,
        session
      );

      createdPharmacy.documents = documents;
      await createdPharmacy.save({ session });

      return createdPharmacy;
    });

    if (!pharmacy) {
      throw new Error(
        'Admin pharmacy registration transaction returned no pharmacy.'
      );
    }

    return serializePharmacyProfile(pharmacy);
  } catch (error) {
    if (isDuplicateEmailError(error)) {
      throw httpError(HTTP_STATUS.CONFLICT, API_MESSAGES.EMAIL_IN_USE);
    }

    if (isDuplicatePhoneError(error)) {
      throw httpError(HTTP_STATUS.CONFLICT, API_MESSAGES.PHONE_IN_USE);
    }

    throw error;
  } finally {
    await session.endSession();
  }
}

//===============================================================

export async function updatePharmacyStatusByAdminService(
  pharmacyId: string,
  input: UpdatePharmacyStatusInput,
  adminUserId: string
) {
  const session = await mongoose.startSession();

  try {
    const updatedPharmacy = await session.withTransaction(async () => {
      const pharmacy = await Pharmacy.findById(pharmacyId).session(session);

      if (!pharmacy) {
        throw httpError(HTTP_STATUS.NOT_FOUND, API_MESSAGES.PHARMACY_NOT_FOUND);
      }

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
