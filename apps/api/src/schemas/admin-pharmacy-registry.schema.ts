import { z } from 'zod';
import { PHARMACY_STATUSES } from '../constants/auth';

import {
  DATE_RANGE_MESSAGE,
  dateQuerySchema,
  isDateRangeOrdered,
  mongoIdSchema,
  normalizePaginationQuery,
  optionalSchema,
  optionalTrimmedTextSchema,
  positivePageSchema,
} from './shared';

//===============================================================

// Stage 14.4: read-only registry; no detail or moderation mutations.
export const ADMIN_PHARMACY_REGISTRY_RATINGS = [
  '0-0.9',
  '1-1.9',
  '2-2.9',
  '3-3.9',
  '4-5',
] as const;

//===============================================================

const searchSchema = optionalTrimmedTextSchema({
  maxLength: 120,
  maxMessage: 'Search must be at most 120 characters.',
});

//===============================================================

const perPageSchema = z.coerce
  .number()
  .int()

  .refine(
    (value) => [20, 50, 100].includes(value),
    'perPage must be 20, 50, or 100.'
  )

  .default(20);

//===============================================================

export const adminPharmacyRegistryListQuerySchema = z.preprocess(
  normalizePaginationQuery,
  z
    .object({
      pharmacySearch: searchSchema,
      ownerSearch: searchSchema,
      pharmacyId: optionalSchema(mongoIdSchema),
      ownerId: optionalSchema(mongoIdSchema),

      status: optionalSchema(
        z.enum([
          PHARMACY_STATUSES.NEW,
          PHARMACY_STATUSES.ON_VERIFICATION,
          PHARMACY_STATUSES.ACTIVE,
          PHARMACY_STATUSES.ON_MODERATION,
          PHARMACY_STATUSES.BLOCKED,
        ])
      ),

      createdFrom: dateQuerySchema,
      createdTo: dateQuerySchema,
      rating: optionalSchema(z.enum(ADMIN_PHARMACY_REGISTRY_RATINGS)),
      sort: z.enum(['created_desc', 'created_asc']).default('created_desc'),
      page: positivePageSchema,
      perPage: perPageSchema,
    })

    .strict()

    .refine(
      ({ createdFrom, createdTo }) =>
        isDateRangeOrdered(createdFrom, createdTo),
      { path: ['createdTo'], message: DATE_RANGE_MESSAGE }
    )
);

//===============================================================

export const adminPharmacyRegistryOptionsQuerySchema = z
  .object({
    search: searchSchema,
    ownerId: optionalSchema(mongoIdSchema),
    pharmacyId: optionalSchema(mongoIdSchema),
    limit: z.coerce.number().int().min(1).max(20).default(10),
  })

  .strict();
//===============================================================

export type AdminPharmacyRegistryListQuery = z.infer<
  typeof adminPharmacyRegistryListQuerySchema
>;

export type AdminPharmacyRegistryOptionsQuery = z.infer<
  typeof adminPharmacyRegistryOptionsQuerySchema
>;
