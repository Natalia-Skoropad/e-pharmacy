import { ADMIN_PERMISSIONS } from '@/lib/permissions/admin-permissions';

import { AdminPermissionGate } from '@/components/auth/AdminPermissionGate';
import { ActivityHistory } from '@/components/activity/ActivityHistory';

//===================================================================

export default function AdminActivityHistoryPage() {
  return (
    <AdminPermissionGate permission={ADMIN_PERMISSIONS.audit.view}>
      <ActivityHistory />
    </AdminPermissionGate>
  );
}
