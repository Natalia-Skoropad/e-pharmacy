import { z } from 'zod';

import { PHARMACY_OWNER_ADMIN_COMMENT_MAX_LENGTH } from '../constants/pharmacy-owner-admin-comment';

import { mongoIdSchema } from './shared';

//===============================================================

export const createPharmacyOwnerAdminCommentSchema = z
  .object({
    text: z.string().trim().min(1).max(PHARMACY_OWNER_ADMIN_COMMENT_MAX_LENGTH),
    clientRequestId: z.string().trim().uuid(),
  })

  .strict();

//===============================================================

export const pharmacyOwnerAdminCommentParamsSchema = z
  .object({
    ownerId: mongoIdSchema,
    commentId: mongoIdSchema,
  })

  .strict();

//===============================================================

export type CreatePharmacyOwnerAdminCommentInput = z.infer<
  typeof createPharmacyOwnerAdminCommentSchema
>;

export type PharmacyOwnerAdminCommentParams = z.infer<
  typeof pharmacyOwnerAdminCommentParamsSchema
>;
