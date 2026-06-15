import {
  PHARMACY_STATUSES,
  USER_ROLES,
  USER_STATUSES,
} from '../constants/auth';

import { API_MESSAGES } from '../constants/messages';
import { HTTP_STATUS } from '../constants/httpStatus';
import { Pharmacy } from '../models/pharmacy.model';
import { User } from '../models/user.model';
import type { AuthUserResponse } from '../types/auth';
import type { PharmacyStatus } from '../types/pharmacy';
import { httpError } from '../utils/httpError';
import { isDuplicateEmailError } from '../utils/mongoError';
import { hashPassword } from '../utils/password';
import { toAuthUserResponse } from '../utils/userResponse';

//===============================================================

type CreateAdminPharmacyInput = {
  name: string;
  email: string;
  password: string;
  phone: string;
  address?: string;
};

type UpdatePharmacyStatusInput = { status: PharmacyStatus };

//===============================================================

export async function createPharmacyUserByAdminService(
  input: CreateAdminPharmacyInput,
  adminUserId: string
): Promise<AuthUserResponse> {
  if (await User.exists({ email: input.email }))
    throw httpError(HTTP_STATUS.CONFLICT, API_MESSAGES.EMAIL_IN_USE);
  try {
    const pharmacyUser = await User.create({
      name: input.name,
      email: input.email,
      password: await hashPassword(input.password),
      role: USER_ROLES.PHARMACY,
      status: USER_STATUSES.ACTIVE,
      phone: input.phone,
      address: input.address,
      createdBy: adminUserId,
      updatedBy: adminUserId,
    });

    await Pharmacy.create({
      ownerId: pharmacyUser._id,
      managerUserIds: [],
      name: input.name,
      address: input.address ?? 'Address pending verification',
      phone: input.phone,
      email: input.email,
      status: PHARMACY_STATUSES.NEW,
      createdBy: adminUserId,
      updatedBy: adminUserId,
    });

    return toAuthUserResponse(pharmacyUser);
  } catch (error) {
    if (isDuplicateEmailError(error))
      throw httpError(HTTP_STATUS.CONFLICT, API_MESSAGES.EMAIL_IN_USE);
    throw error;
  }
}

export async function updatePharmacyStatusByAdminService(
  pharmacyId: string,
  input: UpdatePharmacyStatusInput,
  adminUserId: string
) {
  const set: Record<string, unknown> = {
    status: input.status,
    updatedBy: adminUserId,
  };

  const unset: Record<string, ''> = {};
  if (input.status === PHARMACY_STATUSES.ACTIVE) {
    set.approvedBy = adminUserId;
    set.approvedAt = new Date();
  } else if (input.status !== PHARMACY_STATUSES.ON_MODERATION) {
    unset.approvedBy = '';
    unset.approvedAt = '';
  }

  const pharmacy = await Pharmacy.findByIdAndUpdate(
    pharmacyId,
    { $set: set, $unset: unset },
    { returnDocument: 'after', runValidators: true }
  ).lean();

  if (!pharmacy)
    throw httpError(HTTP_STATUS.NOT_FOUND, 'Pharmacy was not found.');

  return {
    id: String(pharmacy._id),
    status: pharmacy.status,
    approvedBy: pharmacy.approvedBy ? String(pharmacy.approvedBy) : undefined,
    approvedAt: pharmacy.approvedAt?.toISOString(),
    updatedAt: pharmacy.updatedAt?.toISOString(),
  };
}
