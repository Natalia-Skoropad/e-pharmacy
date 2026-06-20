'use client';

import { ProtectedRoute as SharedProtectedRoute } from '@e-pharmacy/auth/guards';
import { ROUTES } from '@/lib/routes';
import { LoadingSpinner } from '@e-pharmacy/ui/common';

import type { ReactNode } from 'react';

//===================================================================

type ClientProtectedRouteProps = {
  children: ReactNode;
};

//===================================================================

function ClientProtectedRoute({ children }: ClientProtectedRouteProps) {
  return (
    <SharedProtectedRoute
      loginPath={ROUTES.LOGIN}
      loadingFallback={<LoadingSpinner label="Checking your session..." />}
      redirectingFallback={<LoadingSpinner label="Redirecting to login..." />}
    >
      {children}
    </SharedProtectedRoute>
  );
}

export default ClientProtectedRoute;
