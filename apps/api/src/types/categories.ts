export const PRODUCT_CATEGORIES = [
  'medicine',
  'vitamins',
  'beauty',
  'hygiene',
  'medical_devices',
  'other',
] as const;

//=============================================================================

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

//=============================================================================

export const PRODUCT_CATEGORY_LABELS: Record<ProductCategory, string> = {
  medicine: 'Medicine',
  vitamins: 'Vitamins',
  beauty: 'Beauty',
  hygiene: 'Hygiene',
  medical_devices: 'Medical devices',
  other: 'Other',
};
