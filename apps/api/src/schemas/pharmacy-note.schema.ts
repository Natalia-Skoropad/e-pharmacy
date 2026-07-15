import { z } from 'zod';

//===============================================================

const mongoId = z.string().regex(/^[a-f\d]{24}$/i, 'ID must be valid');

//===============================================================

export const pharmacyNoteParamsSchema = z.object({
  entityType: z.enum(['client', 'product', 'pharmacy']),
  entityId: mongoId,
});

//===============================================================

export const pharmacyNoteDeleteParamsSchema = pharmacyNoteParamsSchema.extend({
  noteId: mongoId,
});

//===============================================================

export const pharmacyNotesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(10),
});

//===============================================================

export const createPharmacyNoteSchema = z.object({
  text: z.string().trim().min(1).max(1000),
});
