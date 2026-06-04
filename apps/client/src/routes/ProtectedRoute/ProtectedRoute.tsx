'use client';

import { ProtectedRoute as SharedProtectedRoute } from '@e-pharmacy/auth';
import { ROUTES } from '@e-pharmacy/config/routes';
import { LoadingSpinner } from '@e-pharmacy/ui/common';

import type { ReactNode } from 'react';

//===================================================================

type ProtectedRouteProps = {
  children: ReactNode;
};

//===================================================================

function ProtectedRoute({ children }: ProtectedRouteProps) {
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

export default ProtectedRoute;
