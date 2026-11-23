import type { ProductRequestStatus } from '@e-pharmacy/types/product-requests';

import type { Assert, IsExactValueSet } from '../internal/type-assertions';

//===================================================================

export const PRODUCT_REQUEST_STATUSES = [
  'new',
  'on_moderation',
  'approved',
  'rejected',
] as const satisfies readonly ProductRequestStatus[];

//===================================================================

type _ProductRequestStatusesAreExhaustive = Assert<
  IsExactValueSet<ProductRequestStatus, typeof PRODUCT_REQUEST_STATUSES>
>;
