import { notFound, redirect } from 'next/navigation';

import { ADMIN_PERMISSIONS } from '@/lib/permissions/admin-permissions';

import {
  isProductRequestsFilterRoute,
  parseProductRequestsSegments,
  parseProductRequestsPaginationSegments,
  buildProductRequestsPath,
} from '@/lib/product-requests/admin-product-request-paths';

import { AdminPermissionGate } from '@/components/auth/AdminPermissionGate';
import { AdminProductRequestsList } from '@/components/product-requests/AdminProductRequestsList';

//===================================================================

export default async function FilteredAdminProductRequestsPage({
  params,
}: Readonly<{ params: Promise<{ filters: string[] }> }>) {
  const resolved = await params;

  if (!isProductRequestsFilterRoute(resolved.filters)) notFound();

  const canonical = buildProductRequestsPath(
    parseProductRequestsSegments(resolved),
    parseProductRequestsPaginationSegments(resolved)
  );

  if (canonical !== `/admin/product-requests/${resolved.filters.join('/')}`)
    redirect(canonical);

  return (
    <AdminPermissionGate permission={ADMIN_PERMISSIONS.productRequests.view}>
      <AdminProductRequestsList />
    </AdminPermissionGate>
  );
}
