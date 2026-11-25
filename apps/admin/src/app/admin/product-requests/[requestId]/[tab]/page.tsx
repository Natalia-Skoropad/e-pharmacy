import { notFound, redirect } from 'next/navigation';

import { isValidObjectId } from '@e-pharmacy/validation/url';

import { ADMIN_PERMISSIONS } from '@/lib/permissions/admin-permissions';

import {
  isRequestTab,
  requestTabPath,
} from '@/lib/product-requests/admin-product-request-detail';

import {
  isProductRequestsFilterRoute,
  buildProductRequestsPath,
  parseProductRequestsSegments,
  parseProductRequestsPaginationSegments,
} from '@/lib/product-requests/admin-product-request-paths';

import { AdminPermissionGate } from '@/components/auth/AdminPermissionGate';
import { AdminProductRequestDetails } from '@/components/product-requests/AdminProductRequests';
import { AdminProductRequestsList } from '@/components/product-requests/AdminProductRequestsList';

//===================================================================

export default async function Page({
  params,
}: {
  params: Promise<{ requestId: string; tab: string }>;
}) {
  const { requestId, tab } = await params;
  if (isProductRequestsFilterRoute([requestId, tab])) {
    const filters = { filters: [requestId, tab] };

    const canonical = buildProductRequestsPath(
      parseProductRequestsSegments(filters),
      parseProductRequestsPaginationSegments(filters)
    );

    if (canonical !== `/admin/product-requests/${requestId}/${tab}`)
      redirect(canonical);

    return (
      <AdminPermissionGate permission={ADMIN_PERMISSIONS.productRequests.view}>
        <AdminProductRequestsList />
      </AdminPermissionGate>
    );
  }

  if (!isValidObjectId(requestId) || !isRequestTab(tab)) notFound();
  if (tab === 'details') redirect(requestTabPath(requestId, tab));

  return (
    <AdminPermissionGate permission={ADMIN_PERMISSIONS.productRequests.view}>
      <AdminProductRequestDetails requestId={requestId} activeTab={tab} />
    </AdminPermissionGate>
  );
}
