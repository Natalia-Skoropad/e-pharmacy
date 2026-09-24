'use client';

import type { ReactNode } from 'react';

import { GuestOnlyRoute } from '@e-pharmacy/auth/next';
import { PageLoader } from '@e-pharmacy/ui/status-pages';

import { resolveAdminLoginDestination } from '@/lib/auth/resolve-login-destination';

//===================================================================

type AdminGuestOnlyRouteProps = Readonly<{
  children: ReactNode;
}>;

//===================================================================

function resolveAuthenticatedAdminRoute(
  _user: unknown,
  requestedRedirect: string | null
): string {
  return resolveAdminLoginDestination(requestedRedirect);
}

//===================================================================

export function AdminGuestOnlyRoute({ children }: AdminGuestOnlyRouteProps) {
  return (
    <GuestOnlyRoute
      authenticatedRedirectPath={resolveAuthenticatedAdminRoute}
      allowGuestContentWhenUnavailable
      loadingFallback={<PageLoader label="Checking admin session..." />}
    >
      {children}
    </GuestOnlyRoute>
  );
}
