'use client';

import type { ReactNode } from 'react';

import { RoleProtectedRoute } from '@e-pharmacy/auth/guards';
import { useAuth } from '@e-pharmacy/auth/core';
import { LoadingSpinner } from '@e-pharmacy/ui/common';

import { ROUTES } from '@/lib/routes';
import { resolveLoginDestination } from '@/lib/auth';

//===================================================================

type ClientProtectedRouteProps = {
  children: ReactNode;
};

//===================================================================

function ClientProtectedRoute({ children }: ClientProtectedRouteProps) {
  const { user } = useAuth();
  const pharmacyRedirect = user
    ? resolveLoginDestination({ user, requestedRedirect: null })
    : ROUTES.HOME;

  return (
    <RoleProtectedRoute
      allowedRoles={['client']}
      loginPath={ROUTES.LOGIN}
      forbiddenPath={pharmacyRedirect}
      loadingFallback={<LoadingSpinner label="Checking your session..." />}
      redirectingFallback={<LoadingSpinner label="Redirecting to login..." />}
      forbiddenFallback={<LoadingSpinner label="Opening the right cabinet..." />}
    >
      {children}
    </RoleProtectedRoute>
  );
}

export default ClientProtectedRoute;
