import { redirect } from 'next/navigation';

import { isValidObjectId } from '@e-pharmacy/validation/url';

import { getPharmacyNewOrderPath } from '@/lib/routes';

//===================================================================

// Legacy bookmarks canonicalize; a new order must have an explicit pharmacy.
export default async function CreatePharmacyOrderPage({
  searchParams,
}: Readonly<{ searchParams: Promise<{ pharmacyId?: string | string[] }> }>) {
  const { pharmacyId } = await searchParams;

  redirect(
    typeof pharmacyId === 'string' && isValidObjectId(pharmacyId)
      ? getPharmacyNewOrderPath(pharmacyId)
      : '/pharmacy/orders'
  );
}
