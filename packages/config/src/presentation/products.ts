import type { ProductStatus } from '@e-pharmacy/types/products';

import type { StatusPresentation } from './types';

//===================================================================

export const PRODUCT_STATUS_PRESENTATION = {
  new: { label: 'New', tone: 'info' },
  active: { label: 'Active', tone: 'success' },
  blocked: { label: 'Blocked', tone: 'danger' },
} as const satisfies Readonly<Record<ProductStatus, StatusPresentation>>;
