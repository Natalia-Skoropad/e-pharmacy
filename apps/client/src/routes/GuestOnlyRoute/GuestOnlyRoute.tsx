'use client';

import { GuestOnlyRoute as SharedGuestOnlyRoute } from '@e-pharmacy/auth';
import { ROUTES } from '@e-pharmacy/config/routes';

import type { ReactNode } from 'react';

//===================================================================

type GuestOnlyRouteProps = {
  children: ReactNode;
};

//===================================================================

function GuestOnlyRoute({ children }: GuestOnlyRouteProps) {
  return (
    <SharedGuestOnlyRoute authenticatedRedirectPath={ROUTES.PROFILE}>
      {children}
    </SharedGuestOnlyRoute>
  );
}

export default GuestOnlyRoute;
