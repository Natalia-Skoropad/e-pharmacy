import { notFound } from 'next/navigation';

import { isValidObjectId } from '@e-pharmacy/validation/url';

import { ADMIN_PERMISSIONS } from '@/lib/permissions/admin-permissions';
import { parseAdminActivityUrl } from '@/lib/audit/admin-activity-url';

import { AdminPermissionGate } from '@/components/auth/AdminPermissionGate';
import { AdminProductRequestDetails } from '@/components/product-requests/AdminProductRequests';

//===================================================================

export default async function Page({
  params,
}: {
  params: Promise<{ requestId: string; filters: string[] }>;
}) {
  const { requestId, filters } = await params;

  if (!isValidObjectId(requestId)) notFound();

  const state = parseAdminActivityUrl(filters);

  const initialActivityState =
    state.section === 'productRequests'
      ? state
      : {
          ...state,
          section: '' as const,
          action: '' as const,
          changeType: '' as const,
        };

  return (
    <AdminPermissionGate permission={ADMIN_PERMISSIONS.productRequests.view}>
      <AdminProductRequestDetails
        requestId={requestId}
        activeTab="activity"
        initialActivityState={initialActivityState}
      />
    </AdminPermissionGate>
  );
}
