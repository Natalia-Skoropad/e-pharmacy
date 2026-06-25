'use client';

import type { ReactNode } from 'react';

import { GuestOnlyRoute as SharedGuestOnlyRoute } from '@e-pharmacy/auth/guards';
import { LoadingSpinner } from '@e-pharmacy/ui/common';

import { resolveAuthenticatedRouteForClientApp } from '@/lib/auth';

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
