import type { ProductRequestStatus } from '@e-pharmacy/types/product-requests';

//===================================================================

export type ProductRequestPageMode = 'new' | 'clone' | 'edit' | 'readonly';

//===================================================================

export function resolveProductRequestPageMode(
  input: Readonly<{
    requestId?: string;
    sourceRequestId?: string;
    requestStatus?: ProductRequestStatus;
  }>
): ProductRequestPageMode {
  if (input.requestId) {
    return input.requestStatus === 'draft' ? 'edit' : 'readonly';
  }

  if (input.sourceRequestId) return 'clone';

  return 'new';
}

//===================================================================

export function getProductRequestGenerationKey(
  input: Readonly<{
    requestId?: string;
    sourceRequestId?: string;
  }>
): string {
  if (input.requestId) return `request:${input.requestId}`;
  if (input.sourceRequestId) return `clone:${input.sourceRequestId}`;
  return 'new-product-request';
}
