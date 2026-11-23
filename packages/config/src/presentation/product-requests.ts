import type { ProductRequestStatus } from '@e-pharmacy/types/product-requests';

import type { StatusPresentation } from './types';

//===================================================================

export const PRODUCT_REQUEST_STATUS_PRESENTATION = {
  new: { label: 'New', tone: 'info' },
  on_moderation: { label: 'On moderation', tone: 'pending' },
  approved: { label: 'Approved', tone: 'success' },
  rejected: { label: 'Rejected', tone: 'danger' },
} as const satisfies Readonly<Record<ProductRequestStatus, StatusPresentation>>;
