import { AdminPermissionGate } from '@/components/auth/AdminPermissionGate';
import { ActivityHistory } from '@/components/activity/ActivityHistory';
import { ADMIN_PERMISSIONS } from '@/lib/permissions/admin-permissions';

//===================================================================

export default function AdminActivityHistoryPage() {
  return (
    <AdminPermissionGate permission={ADMIN_PERMISSIONS.audit.view}>
      <ActivityHistory />
    </AdminPermissionGate>
  );
}
