import { z } from 'zod';

import { sharedSearchSchema } from './shared-validation.schema';

import { PRODUCT_CATEGORIES } from '../types/categories';

//===============================================================

export const PRODUCT_REQUEST_STATUS_OPTIONS = [
  'draft',
  'new',
  'in_progress',
  'approved',
  'rejected',
] as const;

//===============================================================

const mongoIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'ID must be valid');
const positivePageSchema = z.coerce.number().int().min(1).default(1);
const perPageSchema = z.coerce.number().int().min(1).max(200).default(20);
const dateFilterSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must use YYYY-MM-DD format')
  .optional();

//===============================================================

function normalizePaginationQuery(value: unknown): unknown {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return value;
  }

  const query = { ...(value as Record<string, unknown>) };

  if (query.perPage === undefined && query.limit !== undefined) {
    query.perPage = query.limit;
  }

  return query;
}

//===============================================================

export const productRequestsQuerySchema = z.preprocess(
  normalizePaginationQuery,
  z.object({
    page: positivePageSchema,
    perPage: perPageSchema,
    dateFrom: dateFilterSchema,
    dateTo: dateFilterSchema,
    name: sharedSearchSchema,
    article: sharedSearchSchema,
    category: z.enum(PRODUCT_CATEGORIES).optional(),
    status: z.enum(PRODUCT_REQUEST_STATUS_OPTIONS).optional(),
  })
);

//===============================================================

export const productRequestParamsSchema = z.object({
  requestId: mongoIdSchema,
});

//===============================================================

export type ProductRequestsQuery = z.infer<typeof productRequestsQuerySchema>;
