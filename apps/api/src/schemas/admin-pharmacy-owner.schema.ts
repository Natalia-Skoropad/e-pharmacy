import { z } from 'zod';

import {
  PHARMACY_OWNER_ACCOUNT_STATUSES,
  PHARMACY_STATUSES,
  USER_STATUSES,
} from '../constants/auth';

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

const ADMIN_OWNER_SEARCH_MAX_LENGTH = 120;
const ADMIN_OWNER_OPTION_LIMIT = 20;
const ADMIN_OWNER_ALLOWED_PER_PAGE = [20, 50, 100] as const;

//===============================================================

export const ADMIN_OWNER_RATING_FILTERS = [
  '0-0.9',
  '1-1.9',
  '2-2.9',
  '3-3.9',
  '4-5',
] as const;

//===============================================================

const adminOwnerSearchSchema = optionalTrimmedTextSchema({
  maxLength: ADMIN_OWNER_SEARCH_MAX_LENGTH,
  maxMessage: `Search must be at most ${ADMIN_OWNER_SEARCH_MAX_LENGTH} characters.`,
});

//===============================================================

const adminOwnerPerPageSchema = z.coerce
  .number()
  .int()
  .refine(
    (value): value is (typeof ADMIN_OWNER_ALLOWED_PER_PAGE)[number] =>
      ADMIN_OWNER_ALLOWED_PER_PAGE.includes(
        value as (typeof ADMIN_OWNER_ALLOWED_PER_PAGE)[number]
      ),
    { message: 'perPage must be 20, 50, or 100.' }
  )
  .default(20);

//===============================================================

const adminOwnerStatusQuerySchema = optionalSchema(
  z.enum(PHARMACY_OWNER_ACCOUNT_STATUSES)
);

//===============================================================

const adminPharmacyStatusQuerySchema = optionalSchema(
  z.enum([
    PHARMACY_STATUSES.NEW,
    PHARMACY_STATUSES.ON_VERIFICATION,
    PHARMACY_STATUSES.ON_MODERATION,
    PHARMACY_STATUSES.ACTIVE,
    PHARMACY_STATUSES.BLOCKED,
  ])
);

//===============================================================

const adminPharmacyRatingQuerySchema = optionalSchema(
  z.enum(ADMIN_OWNER_RATING_FILTERS)
);

//===============================================================

export const adminPharmacyOwnerListQuerySchema = z.preprocess(
  normalizePaginationQuery,
  z
    .object({
      search: adminOwnerSearchSchema,
      status: adminOwnerStatusQuerySchema,
      registeredFrom: dateQuerySchema,
      registeredTo: dateQuerySchema,
      page: positivePageSchema,
      perPage: adminOwnerPerPageSchema,
    })

    .strict()

    .refine(
      ({ registeredFrom, registeredTo }) =>
        isDateRangeOrdered(registeredFrom, registeredTo),
      { message: DATE_RANGE_MESSAGE, path: ['registeredTo'] }
    )
);

//===============================================================

export const adminPharmacyOwnerOptionsQuerySchema = z
  .object({
    search: adminOwnerSearchSchema,

    limit: z.coerce
      .number()
      .int()
      .min(1)
      .max(ADMIN_OWNER_OPTION_LIMIT)
      .default(10),
  })

  .strict();

//===============================================================

export const adminPharmacyOwnerPharmaciesQuerySchema = z.preprocess(
  normalizePaginationQuery,
  z
    .object({
      search: adminOwnerSearchSchema,
      status: adminPharmacyStatusQuerySchema,
      createdFrom: dateQuerySchema,
      createdTo: dateQuerySchema,
      rating: adminPharmacyRatingQuerySchema,
      page: positivePageSchema,
      perPage: adminOwnerPerPageSchema,
    })

    .strict()

    .refine(
      ({ createdFrom, createdTo }) =>
        isDateRangeOrdered(createdFrom, createdTo),
      { message: DATE_RANGE_MESSAGE, path: ['createdTo'] }
    )
);

//===============================================================

export const adminPharmacyOwnerActivityQuerySchema = z.preprocess(
  normalizePaginationQuery,
  z
    .object({
      page: positivePageSchema,
      perPage: adminOwnerPerPageSchema,
    })
    .strict()
);

//===============================================================

export const adminPharmacyOwnerParamsSchema = z.object({
  ownerId: mongoIdSchema,
});

//===============================================================

export const updateAdminPharmacyOwnerStatusSchema = z.object({
  status: z.enum([USER_STATUSES.ACTIVE, USER_STATUSES.BLOCKED]),
  reason: z.string().trim().min(1, 'Reason is required.').max(500),
});

//===============================================================

export type AdminPharmacyOwnerListQuery = z.infer<
  typeof adminPharmacyOwnerListQuerySchema
>;

export type AdminPharmacyOwnerOptionsQuery = z.infer<
  typeof adminPharmacyOwnerOptionsQuerySchema
>;

export type AdminPharmacyOwnerPharmaciesQuery = z.infer<
  typeof adminPharmacyOwnerPharmaciesQuerySchema
>;

export type AdminPharmacyOwnerActivityQuery = z.infer<
  typeof adminPharmacyOwnerActivityQuerySchema
>;

export type AdminPharmacyOwnerParams = z.infer<
  typeof adminPharmacyOwnerParamsSchema
>;

export type UpdateAdminPharmacyOwnerStatusInput = z.infer<
  typeof updateAdminPharmacyOwnerStatusSchema
>;
