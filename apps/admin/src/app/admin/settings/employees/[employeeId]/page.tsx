import { ADMIN_PERMISSIONS } from '@/lib/permissions/admin-permissions';

import { AdminPermissionGate } from '@/components/auth/AdminPermissionGate';
import { ActivityEmployeeDetails } from '@/components/activity/ActivityEmployeeDetails';

//===================================================================

type AdminEmployeeDetailsPageProps = Readonly<{
  params: Promise<{ employeeId: string }>;
}>;

//===================================================================

export default async function AdminEmployeeDetailsPage({
  params,
}: AdminEmployeeDetailsPageProps) {
  const { employeeId } = await params;

  return (
    <AdminPermissionGate permission={ADMIN_PERMISSIONS.audit.view}>
      <ActivityEmployeeDetails employeeId={employeeId} />
    </AdminPermissionGate>
  );
}
