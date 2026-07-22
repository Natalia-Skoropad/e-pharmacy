import { z } from 'zod';

import {
  DATE_RANGE_MESSAGE,
  isDateRangeOrdered,
  optionalCalendarDateSchema,
} from './shared/date.schema';

import { PRODUCT_CATEGORIES } from '../types/categories';
import { sharedSearchSchema } from './shared-validation.schema';

//===============================================================

const mongoIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'ID must be valid');
const positivePageSchema = z.coerce.number().int().min(1).default(1);
const perPageSchema = z.coerce.number().int().min(1).max(200).default(20);

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
  z
    .object({
      page: positivePageSchema,
      perPage: perPageSchema,
      firstOrderFrom: optionalCalendarDateSchema,
      firstOrderTo: optionalCalendarDateSchema,
      name: sharedSearchSchema,
      clientId: sharedSearchSchema,
      contact: sharedSearchSchema,
      email: sharedSearchSchema,
      phone: sharedSearchSchema,
      address: sharedSearchSchema,
      status: z.enum(['active', 'blocked']).optional(),
      successfulOrders: z.enum(['repeat', 'successful', 'other']).optional(),
    })
    .refine(
      ({ firstOrderFrom, firstOrderTo }) =>
        isDateRangeOrdered(firstOrderFrom, firstOrderTo),
      { message: DATE_RANGE_MESSAGE, path: ['firstOrderTo'] }
    )
);

//===============================================================

export const clientProductsQuerySchema = z.preprocess(
  normalizePaginationQuery,
  z
    .object({
      page: positivePageSchema,
      perPage: perPageSchema,
      dateFrom: optionalCalendarDateSchema,
      dateTo: optionalCalendarDateSchema,
      article: sharedSearchSchema,
      name: sharedSearchSchema,
      category: z.enum(PRODUCT_CATEGORIES).optional(),
      status: z.enum(['new', 'active', 'blocked']).optional(),
    })
    .refine(({ dateFrom, dateTo }) => isDateRangeOrdered(dateFrom, dateTo), {
      message: DATE_RANGE_MESSAGE,
      path: ['dateTo'],
    })
);

//===============================================================

export const clientParamsSchema = z.object({ clientId: mongoIdSchema });

//===============================================================

export type ClientsQuery = z.infer<typeof clientsQuerySchema>;
export type ClientProductsQuery = z.infer<typeof clientProductsQuerySchema>;
