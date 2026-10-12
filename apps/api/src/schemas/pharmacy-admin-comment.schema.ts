import { z } from 'zod';
import { PHARMACY_OWNER_ADMIN_COMMENT_MAX_LENGTH } from '../constants/pharmacy-owner-admin-comment';
import { mongoIdSchema } from './shared';

//===============================================================

export const createPharmacyAdminCommentSchema = z
  .object({
    text: z.string().trim().min(1).max(PHARMACY_OWNER_ADMIN_COMMENT_MAX_LENGTH),
    clientRequestId: z.string().trim().uuid(),
  })

  .strict();

//===============================================================

export const pharmacyAdminCommentParamsSchema = z
  .object({
    pharmacyId: mongoIdSchema,
    commentId: mongoIdSchema,
  })

  .strict();

//===============================================================

export type CreatePharmacyAdminCommentInput = z.infer<
  typeof createPharmacyAdminCommentSchema
>;
export type PharmacyAdminCommentParams = z.infer<
  typeof pharmacyAdminCommentParamsSchema
>;
