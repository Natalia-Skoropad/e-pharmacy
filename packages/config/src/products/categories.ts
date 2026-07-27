import type { ProductCategory } from '@e-pharmacy/types/products';

import type { Assert, IsExactValueSet } from '../internal/type-assertions';

//===================================================================

export const PRODUCT_CATEGORIES = [
  'medicine',
  'vitamins',
  'beauty',
  'hygiene',
  'medical_devices',
  'other',
] as const satisfies readonly ProductCategory[];

//===================================================================

type _ProductCategoriesAreExhaustive = Assert<
  IsExactValueSet<ProductCategory, typeof PRODUCT_CATEGORIES>
>;
