import { PRODUCT_REQUEST_STATUSES } from '@e-pharmacy/config/product-requests';
import type { ProductRequestStatus } from '@e-pharmacy/types/product-requests';

//===================================================================

export function isProductRequestStatus(
  value: unknown
): value is ProductRequestStatus {
  return PRODUCT_REQUEST_STATUSES.includes(value as ProductRequestStatus);
}
