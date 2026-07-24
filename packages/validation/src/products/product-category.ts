import { PRODUCT_CATEGORIES } from '@e-pharmacy/config/products';
import type { ProductCategory } from '@e-pharmacy/types/products';

//===================================================================

export function isProductCategory(value: unknown): value is ProductCategory {
  return PRODUCT_CATEGORIES.includes(value as ProductCategory);
}
