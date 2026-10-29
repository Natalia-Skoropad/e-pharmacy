import { z } from 'zod';

import { PHARMACY_STATUSES } from '../../constants/auth/auth';
import { ADMIN_PHARMACY_REGISTRY_RATINGS } from '../admin/pharmacies/admin-pharmacy-registry.schema';

import {
  DATE_RANGE_MESSAGE,
  dateQuerySchema,
  isDateRangeOrdered,
  mongoIdSchema,
  normalizePaginationQuery,
  optionalSchema,
  optionalTrimmedTextSchema,
  positivePageSchema,
} from '../shared/index';

//===============================================================

const search = optionalTrimmedTextSchema({
  maxLength: 120,
  maxMessage: 'Search must be at most 120 characters.',
});

const status = optionalSchema(
  z.enum([
    PHARMACY_STATUSES.NEW,
    PHARMACY_STATUSES.ON_VERIFICATION,
    PHARMACY_STATUSES.ACTIVE,
    PHARMACY_STATUSES.ON_MODERATION,
    PHARMACY_STATUSES.ON_REACTIVATION,
    PHARMACY_STATUSES.BLOCKED,
  ])
);

const perPage = z.coerce
  .number()
  .int()

  .refine((value) => [20, 50, 100].includes(value), {
    message: 'perPage must be 20, 50, or 100.',
  })

  .default(20);

//===============================================================

// No ownerId/ownerSearch: the actor identity comes exclusively from auth.
export const ownedPharmacyRegistryListQuerySchema = z.preprocess(
  normalizePaginationQuery,
  z
    .object({
      pharmacySearch: search,
      pharmacyId: optionalSchema(mongoIdSchema),
      settlement: search,
      region: search,
      status,
      createdFrom: dateQuerySchema,
      createdTo: dateQuerySchema,
      rating: optionalSchema(z.enum(ADMIN_PHARMACY_REGISTRY_RATINGS)),
      sort: z.enum(['created_desc', 'created_asc']).default('created_desc'),
      page: positivePageSchema,
      perPage,
    })

    .strict()

    .refine(
      ({ createdFrom, createdTo }) =>
        isDateRangeOrdered(createdFrom, createdTo),
      { path: ['createdTo'], message: DATE_RANGE_MESSAGE }
    )
);

//===============================================================

export const ownedPharmacyRegistryOptionsQuerySchema = z
  .object({
    search,
    limit: z.coerce.number().int().min(1).max(20).default(10),
  })

  .strict();

export const ownedPharmacyRegistryParamsSchema = z
  .object({ pharmacyId: mongoIdSchema })
  .strict();

export const ownedPharmacyDocumentParamsSchema =
  ownedPharmacyRegistryParamsSchema
    .extend({ documentId: mongoIdSchema })
    .strict();

//===============================================================

export type OwnedPharmacyRegistryListQuery = z.infer<
  typeof ownedPharmacyRegistryListQuerySchema
>;

export type OwnedPharmacyRegistryOptionsQuery = z.infer<
  typeof ownedPharmacyRegistryOptionsQuerySchema
>;

export type OwnedPharmacyRegistryParams = z.infer<
  typeof ownedPharmacyRegistryParamsSchema
>;

export type OwnedPharmacyDocumentParams = z.infer<
  typeof ownedPharmacyDocumentParamsSchema
>;

//===============================================================

/** Read-only owner activity pagination. Never accept an owner ID in the query. */
export const ownedPharmacyLifecycleHistoryQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).max(10000).default(1),
  })

  .strict();
