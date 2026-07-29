import type { ReactNode } from 'react';

import { ClientGuestOnlyRoute } from '@/routes';

//===================================================================

function ClientGuestLayout({ children }: { children: ReactNode }) {
  return <ClientGuestOnlyRoute>{children}</ClientGuestOnlyRoute>;
}

export default ClientGuestLayout;
