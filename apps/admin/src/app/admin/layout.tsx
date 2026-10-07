import type { ReactNode } from 'react';

import { AdminProtectedRoute } from '@/components/auth/AdminProtectedRoute';
import { AdminShell } from '@/components/layout/AdminShell/AdminShell';
import { AdminAuthorizationProvider } from '@/providers/AdminAuthorizationProvider';
import { AdminPharmacyOwnerNavigationBadgeProvider } from '@/providers/AdminPharmacyOwnerNavigationBadgeProvider';

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
          <AdminShell>{children}</AdminShell>
        </AdminPharmacyOwnerNavigationBadgeProvider>
      </AdminAuthorizationProvider>
    </AdminProtectedRoute>
  );
}
