export const PRODUCT_CATEGORIES = [
  'medicine',
  'vitamins',
  'beauty',
  'hygiene',
  'medical_devices',
  'other',
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];
