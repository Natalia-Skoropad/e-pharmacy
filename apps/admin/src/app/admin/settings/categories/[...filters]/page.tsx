import { ADMIN_PERMISSIONS } from '@/lib/permissions/admin-permissions';

import { AdminPermissionGate } from '@/components/auth/AdminPermissionGate';
import { ProductCategoriesSettings } from '@/components/settings/ProductCategoriesSettings/ProductCategoriesSettings';

//===================================================================

// The shared dictionary owns URL parsing, back/forward and filtering.
export default function FilteredSettingsDictionaryPage() {
  return (
    <AdminPermissionGate permission={ADMIN_PERMISSIONS.categories.view}>
      <ProductCategoriesSettings />
    </AdminPermissionGate>
  );
}
