'use client';

import type { ReactNode } from 'react';

import { GuestOnlyRoute as SharedGuestOnlyRoute } from '@e-pharmacy/auth/next';
import { LoadingSpinner } from '@e-pharmacy/ui/primitives';

import {
  resolveAuthenticatedRouteForClientApp,
  resolveTrustedClientAuthExternalRedirect,
} from '@/lib/auth';

//===================================================================

type ClientGuestOnlyRouteProps = {
  children: ReactNode;
};

//===================================================================

function ClientGuestOnlyRoute({ children }: ClientGuestOnlyRouteProps) {
  return (
    <SharedGuestOnlyRoute
      authenticatedRedirectPath={resolveAuthenticatedRouteForClientApp}
      resolveExternalRedirect={resolveTrustedClientAuthExternalRedirect}
      allowGuestContentWhenUnavailable
      loadingFallback={<LoadingSpinner label="Checking your session..." />}
    >
      {children}
    </SharedGuestOnlyRoute>
  );
}

export default ClientGuestOnlyRoute;
