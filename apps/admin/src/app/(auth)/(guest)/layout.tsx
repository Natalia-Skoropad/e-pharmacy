import type { ReactNode } from 'react';

import { AdminGuestOnlyRoute } from '@/components/auth/AdminGuestOnlyRoute';

//===================================================================

type AdminGuestLayoutProps = Readonly<{
  children: ReactNode;
}>;

//===================================================================

export default function AdminGuestLayout({ children }: AdminGuestLayoutProps) {
  return <AdminGuestOnlyRoute>{children}</AdminGuestOnlyRoute>;
}
