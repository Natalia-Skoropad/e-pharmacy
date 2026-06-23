'use client';

import { GuestOnlyRoute as SharedGuestOnlyRoute } from '@e-pharmacy/auth/guards';
import { resolveAuthenticatedRouteForClientApp } from '@/lib/auth';
import { LoadingSpinner } from '@e-pharmacy/ui/common';

import type { ReactNode } from 'react';

//===================================================================

type ClientGuestOnlyRouteProps = {
  children: ReactNode;
};

//===================================================================

function ClientGuestOnlyRoute({ children }: ClientGuestOnlyRouteProps) {
  return (
    <SharedGuestOnlyRoute
      authenticatedRedirectPath={resolveAuthenticatedRouteForClientApp}
      loadingFallback={<LoadingSpinner label="Checking your session..." />}
    >
      {children}
    </SharedGuestOnlyRoute>
  );
}

export default ClientGuestOnlyRoute;
