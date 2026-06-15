import { z } from 'zod';
import { PHARMACY_STATUSES, USER_ROLES } from '../constants/auth';
import { createPharmacyUserSchema } from './auth.schema';

const objectIdSchema = z
  .string()
  .trim()
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

export const createAdminPharmacySchema = createPharmacyUserSchema;

export const pharmacyIdParamsSchema = z.object({
  pharmacyId: objectIdSchema,
});

export const updateAdminPharmacyStatusSchema = z.object({
  status: z.enum([
    PHARMACY_STATUSES.NEW,
    PHARMACY_STATUSES.ON_MODERATION,
    PHARMACY_STATUSES.ACTIVE,
    PHARMACY_STATUSES.BLOCKED,
  ]),
});

export const adminOnlyPharmacyRole = USER_ROLES.PHARMACY;
export const activePharmacyStatus = PHARMACY_STATUSES.ACTIVE;
