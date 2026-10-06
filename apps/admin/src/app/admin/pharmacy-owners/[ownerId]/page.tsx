import { ADMIN_PERMISSIONS } from '@/lib/permissions/admin-permissions';

import { AdminPermissionGate } from '@/components/auth/AdminPermissionGate';
import { ActivityPharmacyOwnerDetails } from '@/components/activity/ActivityEmployeeDetails/ActivityEmployeeDetails';

//===================================================================

type AdminPharmacyOwnerDetailsPageProps = Readonly<{
  params: Promise<{ ownerId: string }>;
}>;

//===================================================================

export default async function AdminPharmacyOwnerDetailsPage({
  params,
}: AdminPharmacyOwnerDetailsPageProps) {
  const { ownerId } = await params;

  return (
    <AdminPermissionGate permission={ADMIN_PERMISSIONS.audit.view}>
      <ActivityPharmacyOwnerDetails ownerId={ownerId} />
    </AdminPermissionGate>
  );
}
