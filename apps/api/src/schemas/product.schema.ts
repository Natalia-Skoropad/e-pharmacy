import { z } from 'zod';

import {
  sharedReviewCommentSchema,
  sharedReviewRatingSchema,
  sharedSearchSchema,
} from './shared-validation.schema';

import { PRODUCT_CATEGORIES } from '../types/categories';

//===============================================================

export const PRODUCT_STATUS_FILTER_OPTIONS = ['active', 'blocked'] as const;

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

const mongoIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'ID must be valid');

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

const positivePageSchema = z.coerce.number().int().min(1).default(1);
const perPageSchema = z.coerce.number().int().min(1).max(200).default(12);
const dateFilterSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must use YYYY-MM-DD format')
  .optional();

//===============================================================

export const productsQuerySchema = z.preprocess(
  normalizePaginationQuery,
  z.object({
    page: positivePageSchema,
    perPage: perPageSchema,
    keyword: sharedSearchSchema,
    nameKeyword: sharedSearchSchema,
    articleKeyword: sharedSearchSchema,
    category: z.enum(PRODUCT_CATEGORIES).optional(),
    status: z.enum(PRODUCT_STATUS_FILTER_OPTIONS).optional(),

    includeBlocked: z
      .preprocess((value) => {
        if (value === 'true') return true;
        if (value === 'false') return false;

        return value;
      }, z.boolean())
      .optional(),
    
    pharmacyId: mongoIdSchema.optional(),
    addedToPharmacyId: mongoIdSchema.optional(),

    addedToMyPharmacy: z
      .preprocess((value) => {
        if (value === 'true') return true;
        if (value === 'false') return false;

        return value;
      }, z.boolean())
      .optional(),
    
    minPrice: z.coerce.number().min(0).optional(),
    maxPrice: z.coerce.number().min(0).optional(),

    inStock: z
      .preprocess((value) => {
        if (value === 'true') return true;
        if (value === 'false') return false;

        return value;
      }, z.boolean())
      .optional(),
    
    addedFrom: dateFilterSchema,
    addedTo: dateFilterSchema,
    sort: z.enum(PRODUCT_SORT_OPTIONS).optional(),
  })
);

//===============================================================

export const productFiltersQuerySchema = z.object({
  pharmacyId: mongoIdSchema.optional(),
  inStock: z
    .preprocess((value) => {
      if (value === 'true') return true;
      if (value === 'false') return false;

      return value;
    }, z.boolean())
    .optional(),
});

//===============================================================

export const productIdParamsSchema = z.object({
  productId: mongoIdSchema,
});

export const productReviewParamsSchema = z.object({
  productId: mongoIdSchema,
  reviewId: mongoIdSchema,
});

export const pendingProductReviewsQuerySchema = z.preprocess(
  normalizePaginationQuery,
  z.object({
    page: positivePageSchema,
    perPage: perPageSchema,
  })
);

export const moderateProductReviewSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  reason: z.string().trim().max(300).optional(),
});

export const productPharmacyParamsSchema = z.object({
  productId: mongoIdSchema,
  pharmacyId: mongoIdSchema,
});

//===============================================================

export const createProductReviewSchema = z.object({
  rating: sharedReviewRatingSchema,
  comment: sharedReviewCommentSchema,
});
