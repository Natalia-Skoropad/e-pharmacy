import type { ReactNode } from 'react';

import { ClientProtectedRoute } from '@/routes';

//===================================================================

function ClientPrivateLayout({ children }: { children: ReactNode }) {
  return <ClientProtectedRoute>{children}</ClientProtectedRoute>;
}

export default ClientPrivateLayout;
