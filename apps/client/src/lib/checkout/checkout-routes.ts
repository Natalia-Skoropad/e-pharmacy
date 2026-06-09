import { ROUTES, buildSlugId } from '@e-pharmacy/config/routes';

//===================================================================

export function buildCheckoutPath(
  storeName: string | null | undefined,
  storeId: string
): string {
  const safeStoreName = storeName?.trim() ? storeName : 'pharmacy';

  return `${ROUTES.CHECKOUT}/${buildSlugId(safeStoreName, storeId)}`;
}
