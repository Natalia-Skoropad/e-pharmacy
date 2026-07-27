import type { ProductRequestStatus } from '@e-pharmacy/types/product-requests';

import type { StatusPresentation } from './types';

//===================================================================

export const PRODUCT_REQUEST_STATUS_PRESENTATION = {
  draft: { label: 'Draft', tone: 'neutral' },
  new: { label: 'New', tone: 'info' },
  in_progress: { label: 'In work', tone: 'pending' },
  approved: { label: 'Approved', tone: 'success' },
  rejected: { label: 'Rejected', tone: 'danger' },
} as const satisfies Readonly<
  Record<ProductRequestStatus, StatusPresentation>
>;
