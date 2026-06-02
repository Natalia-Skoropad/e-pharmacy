import { SHOP_STATUSES, USER_ROLES, VENDOR_ACCOUNT_STATUSES } from '../constants/auth';
import { API_MESSAGES } from '../constants/messages';
import { HTTP_STATUS } from '../constants/httpStatus';
import { Store } from '../models/store.model';
import { User } from '../models/user.model';

import type { AuthUserResponse } from '../types/auth';
import type { ShopStatus } from '../types/store';
import type { VendorAccountStatus } from '../types/user';

import { httpError } from '../utils/httpError';
import { isDuplicateEmailError } from '../utils/mongoError';
import { hashPassword } from '../utils/password';
import { toAuthUserResponse } from '../utils/userResponse';

//===============================================================

type CreateAdminVendorInput = {
  name: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
  vendorStatus?: VendorAccountStatus;
};

type UpdateVendorStatusInput = {
  vendorStatus: VendorAccountStatus;
};

type UpdateShopStatusInput = {
  status: ShopStatus;
};

//===============================================================

export async function createVendorUserByAdminService(
  input: CreateAdminVendorInput,
  adminUserId: string
): Promise<AuthUserResponse> {
  const existingUser = await User.findOne({ email: input.email });

  if (existingUser) {
    throw httpError(HTTP_STATUS.CONFLICT, API_MESSAGES.EMAIL_IN_USE);
  }

  try {
    const vendor = await User.create({
      name: input.name,
      email: input.email,
      password: await hashPassword(input.password),
      role: USER_ROLES.VENDOR,
      vendorStatus: input.vendorStatus ?? VENDOR_ACCOUNT_STATUSES.PENDING,
      phone: input.phone,
      address: input.address,
      createdBy: adminUserId,
      updatedBy: adminUserId,
      ...(input.vendorStatus === VENDOR_ACCOUNT_STATUSES.ACTIVE
        ? { approvedBy: adminUserId, approvedAt: new Date() }
        : {}),
    });

    return toAuthUserResponse(vendor);
  } catch (error) {
    if (isDuplicateEmailError(error)) {
      throw httpError(HTTP_STATUS.CONFLICT, API_MESSAGES.EMAIL_IN_USE);
    }

    throw error;
  }
}

//===============================================================

export async function updateVendorStatusByAdminService(
  vendorId: string,
  input: UpdateVendorStatusInput,
  adminUserId: string
): Promise<AuthUserResponse> {
  const set: Record<string, unknown> = {
    vendorStatus: input.vendorStatus,
    updatedBy: adminUserId,
  };

  const unset: Record<string, ''> = {};

  if (input.vendorStatus === VENDOR_ACCOUNT_STATUSES.ACTIVE) {
    set.approvedBy = adminUserId;
    set.approvedAt = new Date();
  }

  if (input.vendorStatus === VENDOR_ACCOUNT_STATUSES.REJECTED) {
    unset.approvedBy = '';
    unset.approvedAt = '';
  }

  const vendor = await User.findOneAndUpdate(
    {
      _id: vendorId,
      role: USER_ROLES.VENDOR,
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

  if (!vendor) {
    throw httpError(HTTP_STATUS.NOT_FOUND, 'Vendor account was not found.');
  }

  return toAuthUserResponse(vendor);
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

  if (input.status === SHOP_STATUSES.DRAFT || input.status === SHOP_STATUSES.PENDING_REVIEW) {
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
