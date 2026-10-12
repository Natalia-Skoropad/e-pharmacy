import { ADMIN_PERMISSIONS } from '@/lib/permissions/admin-permissions';
import { parseAdminPharmaciesListSearchParams } from '@/lib/pharmacies/admin-pharmacy-url';

import { AdminPermissionGate } from '@/components/auth/AdminPermissionGate';
import { PharmaciesPageContent } from '@/components/pharmacies/PharmaciesPageContent/PharmaciesPageContent';

//===================================================================

type PharmaciesPageProps = Readonly<{
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>;

//===================================================================

export default async function PharmaciesPage({
  searchParams,
}: PharmaciesPageProps) {
  const initialState = parseAdminPharmaciesListSearchParams(await searchParams);

  return (
    <AdminPermissionGate permission={ADMIN_PERMISSIONS.pharmacies.view}>
      <PharmaciesPageContent initialState={initialState} />
    </AdminPermissionGate>
  );
}
