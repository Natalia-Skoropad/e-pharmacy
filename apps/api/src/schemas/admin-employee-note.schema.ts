import { z } from 'zod';

import { ADMIN_EMPLOYEE_PRIVATE_NOTE_MAX_LENGTH } from '../constants/admin-employee-private-note';

import {
  createPerPageSchema,
  mongoIdSchema,
  positivePageSchema,
} from './shared';

//===============================================================

export const adminEmployeePrivateNotesQuerySchema = z
  .object({
    page: positivePageSchema,
    perPage: createPerPageSchema({ defaultValue: 10, max: 100 }),
  })

  .strict();

//===============================================================

export const createAdminEmployeePrivateNoteSchema = z
  .object({
    text: z.string().trim().min(1).max(ADMIN_EMPLOYEE_PRIVATE_NOTE_MAX_LENGTH),
    clientRequestId: z.string().trim().uuid(),
  })

  .strict();

//===============================================================

export const adminEmployeePrivateNoteParamsSchema = z
  .object({
    commentId: mongoIdSchema,
  })

  .strict();

//===============================================================

export type AdminEmployeePrivateNotesQuery = z.infer<
  typeof adminEmployeePrivateNotesQuerySchema
>;

export type CreateAdminEmployeePrivateNoteInput = z.infer<
  typeof createAdminEmployeePrivateNoteSchema
>;

export type AdminEmployeePrivateNoteParams = z.infer<
  typeof adminEmployeePrivateNoteParamsSchema
>;
