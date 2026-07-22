import { z } from 'zod';

import {
  booleanQuerySchema,
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

import {
  sharedReviewCommentSchema,
  sharedReviewRatingSchema,
  sharedSearchSchema,
} from './shared-validation.schema';

import { PRODUCT_CATEGORIES } from '../types/categories';

//===============================================================

export const PRODUCT_STATUS_FILTER_OPTIONS = ['active', 'blocked'] as const;

//===============================================================

export const PRODUCT_STOCK_FILTER_OPTIONS = [
  'in-stock',
  'available',
  'empty',
  'reserved',
] as const;

//===============================================================

export const PRODUCT_SORT_OPTIONS = [
  'price-asc',
  'price-desc',
  'rating-desc',
  'rating-asc',
  'name-asc',
  'name-desc',
  'newest',
] as const;

//===============================================================

const productsPerPageSchema = createPerPageSchema({
  defaultValue: 12,
  max: 200,
});

//===============================================================

export const productsQuerySchema = z.preprocess(
  normalizePaginationQuery,
  z
    .object({
      page: positivePageSchema,
      perPage: productsPerPageSchema,
      keyword: sharedSearchSchema,
      nameKeyword: sharedSearchSchema,
      articleKeyword: sharedSearchSchema,
      category: z.enum(PRODUCT_CATEGORIES).optional(),
      status: z.enum(PRODUCT_STATUS_FILTER_OPTIONS).optional(),

      includeBlocked: booleanQuerySchema.optional(),

      pharmacyId: mongoIdSchema.optional(),
      addedToPharmacyId: mongoIdSchema.optional(),

      addedToMyPharmacy: booleanQuerySchema.optional(),

      minPrice: z.coerce.number().min(0).optional(),
      maxPrice: z.coerce.number().min(0).optional(),

      inStock: booleanQuerySchema.optional(),
      stock: z.enum(PRODUCT_STOCK_FILTER_OPTIONS).optional(),

      addedFrom: dateQuerySchema,
      addedTo: dateQuerySchema,
      sort: z.enum(PRODUCT_SORT_OPTIONS).optional(),
    })
    .refine(
      ({ addedFrom, addedTo }) => isDateRangeOrdered(addedFrom, addedTo),
      { message: DATE_RANGE_MESSAGE, path: ['addedTo'] }
    )
);

//===============================================================

export const productFiltersQuerySchema = z.object({
  pharmacyId: mongoIdSchema.optional(),
  inStock: booleanQuerySchema.optional(),
});

//===============================================================

export const productIdParamsSchema = z.object({
  productId: mongoIdSchema,
});

//===============================================================

export const productReviewParamsSchema = z.object({
  productId: mongoIdSchema,
  reviewId: mongoIdSchema,
});

//===============================================================

export const pendingProductReviewsQuerySchema = z.preprocess(
  normalizePaginationQuery,
  z.object({
    page: positivePageSchema,
    perPage: productsPerPageSchema,
  })
);

//===============================================================

export const moderateProductReviewSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  reason: z.string().trim().max(300).optional(),
});

//===============================================================

export const productPharmacyParamsSchema = z.object({
  productId: mongoIdSchema,
  pharmacyId: mongoIdSchema,
});

//===============================================================

export const createProductReviewSchema = z.object({
  rating: sharedReviewRatingSchema,
  comment: sharedReviewCommentSchema,
});

//===============================================================

export type ProductsQuery = z.infer<typeof productsQuerySchema>;
export type ProductFiltersQuery = z.infer<typeof productFiltersQuerySchema>;
export type ProductIdParams = z.infer<typeof productIdParamsSchema>;
export type ProductReviewParams = z.infer<typeof productReviewParamsSchema>;
export type ProductPharmacyParams = z.infer<typeof productPharmacyParamsSchema>;

export type PendingProductReviewsQuery = z.infer<
  typeof pendingProductReviewsQuerySchema
>;

export type CreateProductReviewInput = z.infer<
  typeof createProductReviewSchema
>;

export type ModerateProductReviewInput = z.infer<
  typeof moderateProductReviewSchema
>;
