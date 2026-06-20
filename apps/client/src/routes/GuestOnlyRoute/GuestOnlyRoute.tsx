'use client';

import { GuestOnlyRoute as SharedGuestOnlyRoute } from '@e-pharmacy/auth/guards';
import { resolveAuthenticatedRouteForClientApp } from '@/lib/auth';

import type { ReactNode } from 'react';

//===================================================================

type ClientGuestOnlyRouteProps = {
  children: ReactNode;
};

//===================================================================

function ClientGuestOnlyRoute({ children }: ClientGuestOnlyRouteProps) {
  return (
    <SharedGuestOnlyRoute authenticatedRedirectPath={resolveAuthenticatedRouteForClientApp}>
      {children}
    </SharedGuestOnlyRoute>
  );
}

export default ClientGuestOnlyRoute;
