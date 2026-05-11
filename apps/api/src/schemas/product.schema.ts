import { z } from 'zod';

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
  keyword: z.string().trim().max(80).optional(),
  nameKeyword: z.string().trim().max(80).optional(),
  articleKeyword: z.string().trim().max(80).optional(),
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

export const productStoreParamsSchema = z.object({
  productId: mongoIdSchema,
  storeId: mongoIdSchema,
});

//===============================================================

export const createProductReviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  comment: z
    .string()
    .trim()
    .min(10)
    .max(500)
    .regex(
      /^[A-Za-z0-9\s.,!?;:'"()\-]+$/,
      'Review may contain only latin letters, numbers, spaces and basic punctuation'
    ),
});
