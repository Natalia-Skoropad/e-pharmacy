import type { ProductRequestStatus } from '@e-pharmacy/types/product-requests';

//===================================================================

export const PRODUCT_REQUEST_STATUSES = [
  'draft',
  'new',
  'in_progress',
  'approved',
  'rejected',
] as const satisfies readonly ProductRequestStatus[];
