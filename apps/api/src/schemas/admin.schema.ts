import { z } from 'zod';

import {
  SHOP_STATUSES,
  USER_ROLES,
  VENDOR_ACCOUNT_STATUSES,
} from '../constants/auth';

import {
  createVendorUserSchema,
  updateVendorStatusSchema,
} from './auth.schema';

//===============================================================

const objectIdSchema = z
  .string()
  .trim()
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

//===============================================================

export const createAdminVendorSchema = createVendorUserSchema;
export const updateAdminVendorStatusSchema = updateVendorStatusSchema;

export const vendorIdParamsSchema = z.object({
  vendorId: objectIdSchema,
});

export const shopIdParamsSchema = z.object({
  shopId: objectIdSchema,
});

export const updateAdminShopStatusSchema = z.object({
  status: z.enum([
    SHOP_STATUSES.DRAFT,
    SHOP_STATUSES.PENDING_REVIEW,
    SHOP_STATUSES.ACTIVE,
    SHOP_STATUSES.SUSPENDED,
  ]),
});

//===============================================================

export const adminOnlyVendorRole = USER_ROLES.VENDOR;
export const activeVendorStatus = VENDOR_ACCOUNT_STATUSES.ACTIVE;
