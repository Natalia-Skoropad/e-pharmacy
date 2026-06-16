import { PRODUCT_CATEGORY_LABELS } from '@e-pharmacy/types/products';
import type { ProductCategory } from '@e-pharmacy/types';

//===================================================================

export { PRODUCT_CATEGORY_LABELS };

//===================================================================

export function formatProductCategoryLabel(category: ProductCategory): string {
  return PRODUCT_CATEGORY_LABELS[category] ?? category;
}
