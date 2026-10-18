import { ADMIN_PERMISSIONS } from '@/lib/permissions/admin-permissions';

import { AdminPermissionGate } from '@/components/auth/AdminPermissionGate';
import { PositionsSettings } from '@/components/settings/PositionsSettings/PositionsSettings';

//===================================================================

// The shared dictionary owns URL parsing, back/forward and filtering.
export default function FilteredSettingsDictionaryPage() {
  return (
    <AdminPermissionGate permission={ADMIN_PERMISSIONS.positions.view}>
      <PositionsSettings />
    </AdminPermissionGate>
  );
}
