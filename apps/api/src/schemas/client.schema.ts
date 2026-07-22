import { z } from 'zod';

import {
  createPerPageSchema,
  mongoIdSchema,
  normalizePaginationQuery,
  positivePageSchema,
} from './shared';

import {
  DATE_RANGE_MESSAGE,
  isDateRangeOrdered,
  dateQuerySchema,
} from './shared/date.schema';

import { PRODUCT_CATEGORIES } from '../types/categories';
import { sharedSearchSchema } from './shared-validation.schema';

//===============================================================

const clientsPerPageSchema = createPerPageSchema({
  defaultValue: 20,
  max: 200,
});

//===============================================================

export const clientsQuerySchema = z.preprocess(
  normalizePaginationQuery,
  z
    .object({
      page: positivePageSchema,
      perPage: clientsPerPageSchema,
      firstOrderFrom: dateQuerySchema,
      firstOrderTo: dateQuerySchema,
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
      perPage: clientsPerPageSchema,
      dateFrom: dateQuerySchema,
      dateTo: dateQuerySchema,
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
export type ClientsQuery = z.infer<typeof clientsQuerySchema>;
export type ClientProductsQuery = z.infer<typeof clientProductsQuerySchema>;
export type ClientParams = z.infer<typeof clientParamsSchema>;
