import { ROUTES, buildSlugId } from '@/lib/routes';

//===================================================================

export function buildCheckoutPath(
  pharmacyName: string | null | undefined,
  pharmacyId: string
): string {
  const safePharmacyName = pharmacyName?.trim() ? pharmacyName : 'pharmacy';

  return `${ROUTES.CHECKOUT}/${buildSlugId(safePharmacyName, pharmacyId)}`;
}
