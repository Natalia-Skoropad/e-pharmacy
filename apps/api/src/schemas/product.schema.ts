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
  'newest',
] as const;

//===============================================================

const positivePageSchema = z.coerce.number().int().min(1).default(1);
const perPageSchema = z.coerce.number().int().min(1).max(50).default(12);

//===============================================================

export const productsQuerySchema = z.object({
  page: positivePageSchema,
  perPage: perPageSchema,
  keyword: z.string().trim().max(80).optional(),
  category: z.enum(PRODUCT_CATEGORIES).optional(),
  storeId: z
    .string()
    .regex(/^[a-f\d]{24}$/i, 'Store ID must be valid')
    .optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  inStock: z.coerce.boolean().optional(),
  sort: z.enum(PRODUCT_SORT_OPTIONS).optional(),
});

//===============================================================

export const productIdParamsSchema = z.object({
  productId: z.string().regex(/^[a-f\d]{24}$/i, 'Product ID must be valid'),
});
