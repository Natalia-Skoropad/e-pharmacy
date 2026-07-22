import { z } from 'zod';
import { mongoIdSchema } from './shared';
import { PHARMACY_STATUSES } from '../constants/auth';

//===============================================================

export const pharmacyIdParamsSchema = z.object({
  pharmacyId: mongoIdSchema,
});

//===============================================================

export const updateAdminPharmacyStatusSchema = z.object({
  status: z.enum([
    PHARMACY_STATUSES.NEW,
    PHARMACY_STATUSES.ON_VERIFICATION,
    PHARMACY_STATUSES.ON_MODERATION,
    PHARMACY_STATUSES.ACTIVE,
    PHARMACY_STATUSES.BLOCKED,
  ]),
  reason: z.string().trim().max(1000).optional(),
});

//===============================================================

export type AdminPharmacyParams = z.infer<typeof pharmacyIdParamsSchema>;

export type UpdateAdminPharmacyStatusInput = z.infer<
  typeof updateAdminPharmacyStatusSchema
>;
