import { z } from 'zod';

import { PRIVATE_COMMENT_MAX_LENGTH } from '../constants/private-comment';

import {
  createPerPageSchema,
  mongoIdSchema,
  positivePageSchema,
} from './shared';

//===============================================================

export const pharmacyUserPrivateNotesQuerySchema = z
  .object({
    page: positivePageSchema,
    perPage: createPerPageSchema({ defaultValue: 10, max: 100 }),
  })

  .strict();

export const createPharmacyUserPrivateNoteSchema = z
  .object({
    text: z.string().trim().min(1).max(PRIVATE_COMMENT_MAX_LENGTH),
    clientRequestId: z.string().trim().uuid(),
  })

  .strict();

export const pharmacyUserPrivateNoteParamsSchema = z
  .object({ commentId: mongoIdSchema })
  .strict();

//===============================================================

export type PharmacyUserPrivateNotesQuery = z.infer<
  typeof pharmacyUserPrivateNotesQuerySchema
>;

export type CreatePharmacyUserPrivateNoteInput = z.infer<
  typeof createPharmacyUserPrivateNoteSchema
>;

export type PharmacyUserPrivateNoteParams = z.infer<
  typeof pharmacyUserPrivateNoteParamsSchema
>;
