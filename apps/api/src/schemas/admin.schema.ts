import { z } from 'zod';

import {
  SHOP_STATUSES,
  USER_ROLES,
  PHARMACY_ACCOUNT_STATUSES,
} from '../constants/auth';

import {
  createPharmacyUserSchema,
  updatePharmacyStatusSchema,
} from './auth.schema';

//===============================================================

const objectIdSchema = z
  .string()
  .trim()
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

//===============================================================

export const createAdminPharmacySchema = createPharmacyUserSchema;
export const updateAdminPharmacyStatusSchema = updatePharmacyStatusSchema;

export const pharmacyIdParamsSchema = z.object({
  pharmacyId: objectIdSchema,
});

export const shopIdParamsSchema = z.object({
  shopId: objectIdSchema,
});

export const updateAdminShopStatusSchema = z.object({
  status: z.enum([
    SHOP_STATUSES.NEW,
    SHOP_STATUSES.ON_MODERATION,
    SHOP_STATUSES.ACTIVE,
    SHOP_STATUSES.INACTIVE,
  ]),
});

//===============================================================

export const adminOnlyPharmacyRole = USER_ROLES.PHARMACY;
export const activePharmacyStatus = PHARMACY_ACCOUNT_STATUSES.ACTIVE;
