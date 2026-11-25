import { ADMIN_PERMISSIONS } from '@/lib/permissions/admin-permissions';

import { AdminPermissionGate } from '@/components/auth/AdminPermissionGate';
import { AdminProductRequestsList } from '@/components/product-requests/AdminProductRequestsList';

//===================================================================

export default function AdminProductRequestsPage() {
  return (
    <AdminPermissionGate permission={ADMIN_PERMISSIONS.productRequests.view}>
      <AdminProductRequestsList />
    </AdminPermissionGate>
  );
}
