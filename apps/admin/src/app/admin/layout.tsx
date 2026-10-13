import type { ReactNode } from 'react';

import { AdminAuthorizationProvider } from '@/providers/AdminAuthorizationProvider';
import { AdminPharmacyOwnerNavigationBadgeProvider } from '@/providers/AdminPharmacyOwnerNavigationBadgeProvider';
import { AdminPharmacyNavigationBadgeProvider } from '@/providers/AdminPharmacyNavigationBadgeProvider';

import { AdminProtectedRoute } from '@/components/auth/AdminProtectedRoute';
import { AdminShell } from '@/components/layout/AdminShell/AdminShell';

//===================================================================

type AdminLayoutProps = Readonly<{
  children: ReactNode;
}>;

//===================================================================

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <AdminProtectedRoute>
      <AdminAuthorizationProvider>
        <AdminPharmacyOwnerNavigationBadgeProvider>
          <AdminPharmacyNavigationBadgeProvider>
            <AdminShell>{children}</AdminShell>
          </AdminPharmacyNavigationBadgeProvider>
        </AdminPharmacyOwnerNavigationBadgeProvider>
      </AdminAuthorizationProvider>
    </AdminProtectedRoute>
  );
}
