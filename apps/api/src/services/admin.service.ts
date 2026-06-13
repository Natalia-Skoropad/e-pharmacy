import {
  SHOP_STATUSES,
  USER_ROLES,
  PHARMACY_ACCOUNT_STATUSES,
} from '../constants/auth';

import { API_MESSAGES } from '../constants/messages';
import { HTTP_STATUS } from '../constants/httpStatus';
import { Store } from '../models/store.model';
import { User } from '../models/user.model';

import type { AuthUserResponse } from '../types/auth';
import type { ShopStatus } from '../types/store';
import type { PharmacyAccountStatus } from '../types/user';

import { httpError } from '../utils/httpError';
import { isDuplicateEmailError } from '../utils/mongoError';
import { hashPassword } from '../utils/password';
import { toAuthUserResponse } from '../utils/userResponse';

//===============================================================

type CreateAdminPharmacyInput = {
  name: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
  pharmacyStatus?: PharmacyAccountStatus;
};

type UpdatePharmacyStatusInput = {
  pharmacyStatus: PharmacyAccountStatus;
};

type UpdateShopStatusInput = {
  status: ShopStatus;
};

//===============================================================

export async function createPharmacyUserByAdminService(
  input: CreateAdminPharmacyInput,
  adminUserId: string
): Promise<AuthUserResponse> {
  const existingUser = await User.findOne({ email: input.email });

  if (existingUser) {
    throw httpError(HTTP_STATUS.CONFLICT, API_MESSAGES.EMAIL_IN_USE);
  }

  try {
    const pharmacy = await User.create({
      name: input.name,
      email: input.email,
      password: await hashPassword(input.password),
      role: USER_ROLES.PHARMACY,
      pharmacyStatus: input.pharmacyStatus ?? PHARMACY_ACCOUNT_STATUSES.NEW,
      phone: input.phone,
      address: input.address,
      createdBy: adminUserId,
      updatedBy: adminUserId,
      ...(input.pharmacyStatus === PHARMACY_ACCOUNT_STATUSES.ACTIVE
        ? { approvedBy: adminUserId, approvedAt: new Date() }
        : {}),
    });

    return toAuthUserResponse(pharmacy);
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
): Promise<AuthUserResponse> {
  const set: Record<string, unknown> = {
    pharmacyStatus: input.pharmacyStatus,
    updatedBy: adminUserId,
  };

  const unset: Record<string, ''> = {};

  if (input.pharmacyStatus === PHARMACY_ACCOUNT_STATUSES.ACTIVE) {
    set.approvedBy = adminUserId;
    set.approvedAt = new Date();
  }

  if (input.pharmacyStatus === PHARMACY_ACCOUNT_STATUSES.INACTIVE) {
    unset.approvedBy = '';
    unset.approvedAt = '';
  }

  const pharmacy = await User.findOneAndUpdate(
    {
      _id: pharmacyId,
      role: USER_ROLES.PHARMACY,
    },
    {
      $set: set,
      ...(Object.keys(unset).length > 0 ? { $unset: unset } : {}),
    },
    {
      returnDocument: 'after',
      runValidators: true,
    }
  );

  if (!pharmacy) {
    throw httpError(HTTP_STATUS.NOT_FOUND, 'Pharmacy account was not found.');
  }

  return toAuthUserResponse(pharmacy);
}

//===============================================================

export async function updateShopStatusByAdminService(
  shopId: string,
  input: UpdateShopStatusInput,
  adminUserId: string
) {
  const set: Record<string, unknown> = {
    status: input.status,
    updatedBy: adminUserId,
    isActive: input.status === SHOP_STATUSES.ACTIVE,
  };

  const unset: Record<string, ''> = {};

  if (input.status === SHOP_STATUSES.ACTIVE) {
    set.approvedBy = adminUserId;
    set.approvedAt = new Date();
  }

  if (
    input.status === SHOP_STATUSES.NEW ||
    input.status === SHOP_STATUSES.ON_MODERATION
  ) {
    unset.approvedBy = '';
    unset.approvedAt = '';
  }

  const shop = await Store.findByIdAndUpdate(
    shopId,
    {
      $set: set,
      ...(Object.keys(unset).length > 0 ? { $unset: unset } : {}),
    },
    {
      returnDocument: 'after',
      runValidators: true,
    }
  ).lean();

  if (!shop) {
    throw httpError(HTTP_STATUS.NOT_FOUND, 'Shop was not found.');
  }

  return {
    id: String(shop._id),
    status: shop.status,
    isActive: shop.isActive,
    approvedBy: shop.approvedBy ? String(shop.approvedBy) : undefined,
    approvedAt: shop.approvedAt?.toISOString(),
    updatedAt: shop.updatedAt?.toISOString(),
  };
}
