import { ADMIN_PERMISSIONS } from '@/lib/permissions/admin-permissions';

import { AdminPermissionGate } from '@/components/auth/AdminPermissionGate';
import { ProductCategoriesSettings } from '@/components/settings/ProductCategoriesSettings/ProductCategoriesSettings';

//===================================================================

export default function AdminProductCategoriesPage() {
  return (
    <AdminPermissionGate permission={ADMIN_PERMISSIONS.categories.view}>
      <ProductCategoriesSettings />
    </AdminPermissionGate>
  );
}
