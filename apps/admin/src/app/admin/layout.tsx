import type { ReactNode } from 'react';

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
      <AdminShell>{children}</AdminShell>
    </AdminProtectedRoute>
  );
}
