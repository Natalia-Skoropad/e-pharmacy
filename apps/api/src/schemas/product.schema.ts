import { z } from 'zod';

import {
  sharedReviewCommentSchema,
  sharedReviewRatingSchema,
  sharedSearchSchema,
} from './shared-validation.schema';

//===============================================================

export const PRODUCT_CATEGORIES = [
  'medicine',
  'vitamins',
  'beauty',
  'hygiene',
  'medical-devices',
  'other',
] as const;

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
const positivePageSchema = z.coerce.number().int().min(1).default(1);
const perPageSchema = z.coerce.number().int().min(1).max(200).default(12);

//===============================================================

export const productsQuerySchema = z.object({
  page: positivePageSchema,
  perPage: perPageSchema,
  keyword: sharedSearchSchema,
  nameKeyword: sharedSearchSchema,
  articleKeyword: sharedSearchSchema,
  category: z.enum(PRODUCT_CATEGORIES).optional(),
  storeId: mongoIdSchema.optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  inStock: z
    .preprocess((value) => {
      if (value === 'true') return true;
      if (value === 'false') return false;

      return value;
    }, z.boolean())
    .optional(),
  sort: z.enum(PRODUCT_SORT_OPTIONS).optional(),
});

//===============================================================

export const productIdParamsSchema = z.object({
  productId: mongoIdSchema,
});

export const productReviewParamsSchema = z.object({
  productId: mongoIdSchema,
  reviewId: mongoIdSchema,
});

export const pendingProductReviewsQuerySchema = z.object({
  page: positivePageSchema,
  perPage: perPageSchema,
});

export const moderateProductReviewSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  reason: z.string().trim().max(300).optional(),
});

export const productStoreParamsSchema = z.object({
  productId: mongoIdSchema,
  storeId: mongoIdSchema,
});

//===============================================================

export const createProductReviewSchema = z.object({
  rating: sharedReviewRatingSchema,
  comment: sharedReviewCommentSchema,
});
