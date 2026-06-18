'use client';

import { GuestOnlyRoute as SharedGuestOnlyRoute } from '@e-pharmacy/auth/guards';
import { resolveAuthenticatedRouteForClientApp } from '@/lib/auth';

import type { ReactNode } from 'react';

//===================================================================

type GuestOnlyRouteProps = {
  children: ReactNode;
};

//===================================================================

function GuestOnlyRoute({ children }: GuestOnlyRouteProps) {
  return (
    <SharedGuestOnlyRoute authenticatedRedirectPath={resolveAuthenticatedRouteForClientApp}>
      {children}
    </SharedGuestOnlyRoute>
  );
}

export default GuestOnlyRoute;
