'use client';

import type { ReactNode } from 'react';

import { StatusPageLayout } from '@e-pharmacy/ui/status-pages';

import { useAdminAuthorization } from '@/providers/AdminAuthorizationProvider';
import { canAdmin } from '@/lib/permissions/can-admin';
import type { AdminPermission } from '@/lib/permissions/admin-permissions';
import { STATUS_PAGE_IMAGE } from '@/lib/status-pages/status-page-image';

//===================================================================

type AdminPermissionGateProps = Readonly<{
  permission: AdminPermission;
  children: ReactNode;
  fallback?: ReactNode;
}>;

//===================================================================

export function AdminPermissionGate({
  permission,
  children,
  fallback,
}: AdminPermissionGateProps) {
  const { access } = useAdminAuthorization();

  if (canAdmin(access, permission)) return children;

  return (
    fallback ?? (
      <StatusPageLayout
        eyebrow="Permission required"
        title="You do not have access to this admin feature"
        description="Your account is active, but this operation is not included in your current admin permissions."
        variant="brand"
        landmark="main"
        image={STATUS_PAGE_IMAGE}
      />
    )
  );
}
