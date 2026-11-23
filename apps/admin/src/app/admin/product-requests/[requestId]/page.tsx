import { notFound } from 'next/navigation';

import { isValidObjectId } from '@e-pharmacy/validation/url';

import { ADMIN_PERMISSIONS } from '@/lib/permissions/admin-permissions';

import { AdminPermissionGate } from '@/components/auth/AdminPermissionGate';
import { AdminProductRequestDetails } from '@/components/product-requests/AdminProductRequests';

//===================================================================

export default async function AdminProductRequestDetailsPage({
  params,
}: Readonly<{ params: Promise<{ requestId: string }> }>) {
  const { requestId } = await params;

  if (!isValidObjectId(requestId)) notFound();

  return (
    <AdminPermissionGate permission={ADMIN_PERMISSIONS.productRequests.view}>
      <AdminProductRequestDetails requestId={requestId} />
    </AdminPermissionGate>
  );
}
