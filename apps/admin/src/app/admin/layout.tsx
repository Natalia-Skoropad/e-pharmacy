import type { ReactNode } from 'react';

import { AdminProtectedRoute } from '@/components/auth/AdminProtectedRoute';

//===================================================================

type AdminLayoutProps = Readonly<{
  children: ReactNode;
}>;

//===================================================================

export default function AdminLayout({ children }: AdminLayoutProps) {
  return <AdminProtectedRoute>{children}</AdminProtectedRoute>;
}
