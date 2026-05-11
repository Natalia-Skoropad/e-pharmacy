import { buildSlugId, isNonEmptyString } from '@e-pharmacy/utils';

import { ROUTES } from '@/lib/constants/routes';

//===================================================================

export function buildCheckoutPath(storeName: string | null | undefined, storeId: string): string {
  const safeStoreName = isNonEmptyString(storeName) ? storeName : 'pharmacy';

  return `${ROUTES.CHECKOUT}/${buildSlugId(safeStoreName, storeId)}`;
}
