import { z } from 'zod';

import { REVIEW_COMMENT_PATTERN, VALIDATION_LIMITS } from '@e-pharmacy/validation';

//===============================================================

const positivePageSchema = z.coerce.number().int().min(1).default(1);
const perPageSchema = z.coerce.number().int().min(1).max(100).default(12);

//===============================================================

export const storesQuerySchema = z.object({
  page: positivePageSchema,
  perPage: perPageSchema,
  keyword: z.string().trim().max(80).optional(),
  nameKeyword: z.string().trim().max(80).optional(),
  addressKeyword: z.string().trim().max(80).optional(),
  city: z.string().trim().max(80).optional(),
  sort: z
    .enum(['newest', 'rating-desc', 'rating-asc', 'name-asc', 'name-desc'])
    .default('newest'),
});

//===============================================================

export const storeIdParamsSchema = z.object({
  storeId: z.string().regex(/^[a-f\d]{24}$/i, 'Store ID must be valid'),
});

export const storeReviewParamsSchema = z.object({
  storeId: z.string().regex(/^[a-f\d]{24}$/i, 'Store ID must be valid'),
  reviewId: z.string().regex(/^[a-f\d]{24}$/i, 'Review ID must be valid'),
});

export const pendingStoreReviewsQuerySchema = z.object({
  page: positivePageSchema,
  perPage: perPageSchema,
});

export const moderateStoreReviewSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  reason: z.string().trim().max(300).optional(),
});

//===============================================================

export const createStoreReviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  comment: z
    .string()
    .trim()
    .min(VALIDATION_LIMITS.reviewCommentMin)
    .max(VALIDATION_LIMITS.reviewCommentMax)
    .regex(
      REVIEW_COMMENT_PATTERN,
      'Review may contain only latin letters, numbers, spaces and basic punctuation'
    ),
});
