import { PHARMACY_STATUSES, USER_ROLES } from '../constants/auth';
import { HTTP_STATUS } from '../constants/httpStatus';
import { API_MESSAGES } from '../constants/messages';

import { Pharmacy } from '../models/pharmacy.model';
import { User } from '../models/user.model';

import type { HydratedDocument } from 'mongoose';
import type {
  PharmacyEntity,
  PharmacyProfileResponseDto,
  PharmacyStatus,
} from '../types/pharmacy';

import { httpError } from '../utils/httpError';
import { isDuplicateEmailError } from '../utils/mongoError';
import { hashPassword } from '../utils/password';

//===============================================================

function hasCompleteBankDetails(
  bankDetails?: PharmacyEntity['bankDetails']
): boolean {
  return Boolean(
    bankDetails?.recipientName &&
    bankDetails.taxId &&
    bankDetails.iban &&
    bankDetails.bankName &&
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
    status: pharmacy.status,
    rating: pharmacy.rating ?? 0,
    ...(pharmacy.imageUrl ? { imageUrl: pharmacy.imageUrl } : {}),
    ...(pharmacy.description ? { description: pharmacy.description } : {}),
    reviewsCount: pharmacy.reviewsCount ?? 0,
    updatedAt: pharmacy.updatedAt.toISOString(),
  };
}

//===============================================================

type CreatePharmacyUserInput = {
  name: string;
  email: string;
  password: string;
  phone: string;
  address?: string;
};

type UpdatePharmacyStatusInput = {
  status: PharmacyStatus;
};

//===============================================================

export async function createPharmacyUserByAdminService(
  input: CreatePharmacyUserInput,
  adminUserId: string
) {
  const existingUser = await User.exists({ email: input.email });

  if (existingUser) {
    throw httpError(HTTP_STATUS.CONFLICT, API_MESSAGES.EMAIL_IN_USE);
  }

  const hashedPassword = await hashPassword(input.password);

  try {
    const user = await User.create({
      name: input.name,
      email: input.email,
      password: hashedPassword,
      role: USER_ROLES.PHARMACY,
      phone: input.phone,
      address: input.address,
      createdBy: adminUserId,
    });

    try {
      const pharmacy = await Pharmacy.create({
        ownerId: user._id,
        managerUserIds: [],
        name: user.name,
        address: user.address ?? 'Address pending verification',
        phone: user.phone,
        email: user.email,
        status: PHARMACY_STATUSES.NEW,
        createdBy: adminUserId,
      });

      return serializePharmacyProfile(pharmacy);
    } catch (error) {
      await User.findByIdAndDelete(user._id);
      throw error;
    }
  } catch (error) {
    if (isDuplicateEmailError(error)) {
      throw httpError(HTTP_STATUS.CONFLICT, API_MESSAGES.EMAIL_IN_USE);
    }

    throw error;
  }
}

//===============================================================

export async function updatePharmacyStatusByAdminService(
  pharmacyId: string,
  input: UpdatePharmacyStatusInput,
  adminUserId: string
) {
  const approvalFields =
    input.status === PHARMACY_STATUSES.ACTIVE
      ? { approvedBy: adminUserId, approvedAt: new Date() }
      : { approvedBy: undefined, approvedAt: undefined };

  const pharmacy = await Pharmacy.findByIdAndUpdate(
    pharmacyId,
    {
      $set: {
        status: input.status,
        updatedBy: adminUserId,
        ...approvalFields,
      },
    },
    { new: true, runValidators: true }
  );

  if (!pharmacy) {
    throw httpError(HTTP_STATUS.NOT_FOUND, API_MESSAGES.PHARMACY_NOT_FOUND);
  }

  return serializePharmacyProfile(pharmacy);
}
