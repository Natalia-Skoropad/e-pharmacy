import { ADMIN_PERMISSIONS } from '@/lib/permissions/admin-permissions';

import { AdminPermissionGate } from '@/components/auth/AdminPermissionGate';
import { PositionsSettings } from '@/components/settings/PositionsSettings/PositionsSettings';

//===================================================================

export default function AdminPositionsPage() {
  return (
    <AdminPermissionGate permission={ADMIN_PERMISSIONS.positions.view}>
      <PositionsSettings />
    </AdminPermissionGate>
  );
}
