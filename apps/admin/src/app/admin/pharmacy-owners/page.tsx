import { ADMIN_PERMISSIONS } from '@/lib/permissions/admin-permissions';
import { parseAdminPharmacyOwnersListSearchParams } from '@/lib/pharmacy-owners/admin-pharmacy-owner-url';

import { AdminPermissionGate } from '@/components/auth/AdminPermissionGate';
import { PharmacyOwnersPageContent } from '@/components/pharmacy-owners/PharmacyOwnersPageContent/PharmacyOwnersPageContent';

//===================================================================

type AdminPharmacyOwnersPageProps = Readonly<{
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>;

//===================================================================

export default async function AdminPharmacyOwnersPage({
  searchParams,
}: AdminPharmacyOwnersPageProps) {
  const initialState = parseAdminPharmacyOwnersListSearchParams(
    await searchParams
  );

  return (
    <AdminPermissionGate permission={ADMIN_PERMISSIONS.pharmacyOwners.view}>
      <PharmacyOwnersPageContent initialState={initialState} />
    </AdminPermissionGate>
  );
}
