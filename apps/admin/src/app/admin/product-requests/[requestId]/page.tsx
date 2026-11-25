import { notFound, redirect } from 'next/navigation';

import { isValidObjectId } from '@e-pharmacy/validation/url';

import { ADMIN_PERMISSIONS } from '@/lib/permissions/admin-permissions';

import {
  isProductRequestsFilterSegment,
  parseProductRequestsSegments,
  parseProductRequestsPaginationSegments,
  buildProductRequestsPath,
} from '@/lib/product-requests/admin-product-request-paths';

import { AdminPermissionGate } from '@/components/auth/AdminPermissionGate';
import { AdminProductRequestsList } from '@/components/product-requests/AdminProductRequestsList';
import { AdminProductRequestDetails } from '@/components/product-requests/AdminProductRequests';

//===================================================================

export default async function AdminProductRequestDetailsPage({
  params,
}: Readonly<{ params: Promise<{ requestId: string }> }>) {
  const { requestId } = await params;

  if (isProductRequestsFilterSegment(requestId)) {
    const params = { filters: [requestId] };

    const canonical = buildProductRequestsPath(
      parseProductRequestsSegments(params),
      parseProductRequestsPaginationSegments(params)
    );

    if (canonical !== `/admin/product-requests/${requestId}`)
      redirect(canonical);

    return (
      <AdminPermissionGate permission={ADMIN_PERMISSIONS.productRequests.view}>
        <AdminProductRequestsList />
      </AdminPermissionGate>
    );
  }

  if (!isValidObjectId(requestId)) notFound();

  return (
    <AdminPermissionGate permission={ADMIN_PERMISSIONS.productRequests.view}>
      <AdminProductRequestDetails requestId={requestId} />
    </AdminPermissionGate>
  );
}
