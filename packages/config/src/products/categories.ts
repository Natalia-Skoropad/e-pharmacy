import type { ProductCategory } from '@e-pharmacy/types/products';

//===================================================================

export const PRODUCT_CATEGORIES = [
  'medicine',
  'vitamins',
  'beauty',
  'hygiene',
  'medical_devices',
  'other',
] as const satisfies readonly ProductCategory[];
