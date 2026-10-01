import { z } from 'zod';

import {
  PRODUCT_CATEGORY_SLUG_MAX_LENGTH,
  PRODUCT_CATEGORY_SLUG_PATTERN,
} from '../constants/product-category';

//===============================================================

export const productCategorySlugSchema = z
  .string()
  .trim()
  .min(1, 'Product category is required')
  .max(PRODUCT_CATEGORY_SLUG_MAX_LENGTH, 'Product category slug is too long')
  .regex(PRODUCT_CATEGORY_SLUG_PATTERN, 'Invalid product category slug');
