import { z } from 'zod';

import {
  createPerPageSchema,
  mongoIdSchema,
  positivePageSchema,
} from './shared';

//===============================================================

export const pharmacyNoteParamsSchema = z.object({
  entityType: z.enum(['client', 'product', 'pharmacy', 'product_request']),
  entityId: mongoIdSchema,
});

//===============================================================

export const pharmacyNoteDeleteParamsSchema = pharmacyNoteParamsSchema.extend({
  noteId: mongoIdSchema,
});

//===============================================================

export const pharmacyNotesQuerySchema = z.object({
  page: positivePageSchema,
  perPage: createPerPageSchema({ defaultValue: 10, max: 100 }),
});

//===============================================================

export const createPharmacyNoteSchema = z.object({
  text: z.string().trim().min(1).max(1000),
});

//===============================================================

export type PharmacyNoteParams = z.infer<typeof pharmacyNoteParamsSchema>;

export type PharmacyNoteDeleteParams = z.infer<
  typeof pharmacyNoteDeleteParamsSchema
>;

export type PharmacyNotesQuery = z.infer<typeof pharmacyNotesQuerySchema>;

export type CreatePharmacyNoteInput = z.infer<typeof createPharmacyNoteSchema>;
