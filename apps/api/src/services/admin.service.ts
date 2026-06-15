import { PHARMACY_STATUSES, USER_ROLES } from '../constants/auth';
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

type CreateAdminPharmacyInput = {
  name: string;
  email: string;
  password: string;
  phone: string;
  address?: string;
  pharmacyStatus?: PharmacyStatus;
};

type UpdatePharmacyStatusInput = { status: PharmacyStatus };

export async function createPharmacyUserByAdminService(
  input: CreateAdminPharmacyInput,
  adminUserId: string
): Promise<AuthUserResponse> {
  const existingUser = await User.findOne({ email: input.email });
  if (existingUser) {
    throw httpError(HTTP_STATUS.CONFLICT, API_MESSAGES.EMAIL_IN_USE);
  }

  try {
    const pharmacyUser = await User.create({
      name: input.name,
      email: input.email,
      password: await hashPassword(input.password),
      role: USER_ROLES.PHARMACY,
      pharmacyStatus: input.pharmacyStatus ?? PHARMACY_STATUSES.NEW,
      phone: input.phone,
      address: input.address,
      createdBy: adminUserId,
      updatedBy: adminUserId,
    });

    return toAuthUserResponse(pharmacyUser);
  } catch (error) {
    if (isDuplicateEmailError(error)) {
      throw httpError(HTTP_STATUS.CONFLICT, API_MESSAGES.EMAIL_IN_USE);
    }
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
    isActive: input.status === PHARMACY_STATUSES.ACTIVE,
  };
  const unset: Record<string, ''> = {};

  if (input.status === PHARMACY_STATUSES.ACTIVE) {
    set.approvedBy = adminUserId;
    set.approvedAt = new Date();
  } else {
    unset.approvedBy = '';
    unset.approvedAt = '';
  }

  const pharmacy = await Pharmacy.findByIdAndUpdate(
    pharmacyId,
    { $set: set, $unset: unset },
    { returnDocument: 'after', runValidators: true }
  ).lean();

  if (!pharmacy) {
    throw httpError(HTTP_STATUS.NOT_FOUND, 'Pharmacy was not found.');
  }

  return {
    id: String(pharmacy._id),
    status: pharmacy.status,
    isActive: pharmacy.isActive,
    approvedBy: pharmacy.approvedBy ? String(pharmacy.approvedBy) : undefined,
    approvedAt: pharmacy.approvedAt?.toISOString(),
    updatedAt: pharmacy.updatedAt?.toISOString(),
  };
}
