import type { ProductCategory } from '@e-pharmacy/types';

//===================================================================

export const PRODUCT_CATEGORY_LABELS: Record<ProductCategory, string> = {
  medicine: 'Medicine',
  vitamins: 'Vitamins',
  beauty: 'Beauty',
  hygiene: 'Hygiene',
  'medical-devices': 'Medical devices',
  other: 'Other',
};

//===================================================================

export function formatProductCategoryLabel(category: ProductCategory): string {
  return PRODUCT_CATEGORY_LABELS[category] ?? category;
}
