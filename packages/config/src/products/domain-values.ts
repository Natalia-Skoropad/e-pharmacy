import type { ProductStatus } from '@e-pharmacy/types/products';

import type { Assert, IsExactValueSet } from '../internal/type-assertions';

//===================================================================

export const PRODUCT_STATUSES = [
  'new',
  'active',
  'blocked',
] as const satisfies readonly ProductStatus[];

//===================================================================

type _ProductStatusesAreExhaustive = Assert<
  IsExactValueSet<ProductStatus, typeof PRODUCT_STATUSES>
>;
