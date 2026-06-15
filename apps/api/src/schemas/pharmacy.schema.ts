import { z } from 'zod';

import {
  sharedReviewCommentSchema,
  sharedReviewRatingSchema,
  sharedSearchSchema,
} from './shared-validation.schema';

//===============================================================

const positivePageSchema = z.coerce.number().int().min(1).default(1);
const perPageSchema = z.coerce.number().int().min(1).max(100).default(12);

//===============================================================

export const pharmaciesQuerySchema = z.object({
  page: positivePageSchema,
  perPage: perPageSchema,
  keyword: sharedSearchSchema,
  nameKeyword: sharedSearchSchema,
  addressKeyword: sharedSearchSchema,
  city: sharedSearchSchema,
  sort: z
    .enum(['newest', 'rating-desc', 'rating-asc', 'name-asc', 'name-desc'])
    .default('newest'),
});

//===============================================================

export const pharmacyIdParamsSchema = z.object({
  pharmacyId: z.string().regex(/^[a-f\d]{24}$/i, 'Pharmacy ID must be valid'),
});

export const pharmacyReviewParamsSchema = z.object({
  pharmacyId: z.string().regex(/^[a-f\d]{24}$/i, 'Pharmacy ID must be valid'),
  reviewId: z.string().regex(/^[a-f\d]{24}$/i, 'Review ID must be valid'),
});

export const pendingPharmacyReviewsQuerySchema = z.object({
  page: positivePageSchema,
  perPage: perPageSchema,
});

export const moderatePharmacyReviewSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  reason: z.string().trim().max(300).optional(),
});

//===============================================================

export const createPharmacyReviewSchema = z.object({
  rating: sharedReviewRatingSchema,
  comment: sharedReviewCommentSchema,
});
