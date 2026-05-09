import { z } from 'zod';

//===============================================================

const positivePageSchema = z.coerce.number().int().min(1).default(1);
const perPageSchema = z.coerce.number().int().min(1).max(100).default(12);

//===============================================================

export const storesQuerySchema = z.object({
  page: positivePageSchema,
  perPage: perPageSchema,
  keyword: z.string().trim().max(80).optional(),
  city: z.string().trim().max(80).optional(),
});

//===============================================================

export const storeIdParamsSchema = z.object({
  storeId: z.string().regex(/^[a-f\d]{24}$/i, 'Store ID must be valid'),
});
