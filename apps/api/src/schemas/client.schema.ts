import { z } from 'zod';

import { PRODUCT_CATEGORIES } from '../types/categories';
import { sharedSearchSchema } from './shared-validation.schema';

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

export const clientsQuerySchema = z.preprocess(
  normalizePaginationQuery,
  z.object({
    page: positivePageSchema,
    perPage: perPageSchema,
    firstOrderFrom: dateFilterSchema,
    firstOrderTo: dateFilterSchema,
    name: sharedSearchSchema,
    clientId: sharedSearchSchema,
    contact: sharedSearchSchema,
    email: sharedSearchSchema,
    phone: sharedSearchSchema,
    address: sharedSearchSchema,
    status: z.enum(['active', 'blocked']).optional(),
    successfulOrders: z
      .enum(['repeat', 'successful', 'other'])
      .optional(),
  })
);

//===============================================================

export const clientProductsQuerySchema = z.preprocess(
  normalizePaginationQuery,
  z.object({
    page: positivePageSchema,
    perPage: perPageSchema,
    dateFrom: dateFilterSchema,
    dateTo: dateFilterSchema,
    article: sharedSearchSchema,
    name: sharedSearchSchema,
    category: z.enum(PRODUCT_CATEGORIES).optional(),
    status: z.enum(['new', 'active', 'blocked']).optional(),
  })
);

//===============================================================

export const clientParamsSchema = z.object({ clientId: mongoIdSchema });

//===============================================================

export type ClientsQuery = z.infer<typeof clientsQuerySchema>;
export type ClientProductsQuery = z.infer<typeof clientProductsQuerySchema>;
