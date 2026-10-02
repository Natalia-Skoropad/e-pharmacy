import { z } from 'zod';

import { USER_STATUSES } from '../constants/auth';
import { mongoIdSchema } from './shared';

//===============================================================

export const adminPharmacyOwnerParamsSchema = z.object({
  ownerId: mongoIdSchema,
});

//===============================================================

export const updateAdminPharmacyOwnerStatusSchema = z.object({
  status: z.enum([USER_STATUSES.ACTIVE, USER_STATUSES.BLOCKED]),
  reason: z.string().trim().min(1, 'Reason is required.').max(500),
});

//===============================================================

export type AdminPharmacyOwnerParams = z.infer<
  typeof adminPharmacyOwnerParamsSchema
>;

export type UpdateAdminPharmacyOwnerStatusInput = z.infer<
  typeof updateAdminPharmacyOwnerStatusSchema
>;
