import { ADMIN_PERMISSIONS } from '@/lib/permissions/admin-permissions';
import { parseAdminActivityUrl } from '@/lib/audit/admin-activity-url';

import { AdminPermissionGate } from '@/components/auth/AdminPermissionGate';
import { ActivityHistory } from '@/components/activity/ActivityHistory';

//===================================================================

type Props = Readonly<{ params: Promise<{ filters: string[] }> }>;

//===================================================================

export default async function AdminFilteredActivityPage({ params }: Props) {
  const { filters } = await params;

  return (
    <AdminPermissionGate permission={ADMIN_PERMISSIONS.audit.view}>
      <ActivityHistory initialState={parseAdminActivityUrl(filters)} />
    </AdminPermissionGate>
  );
}
