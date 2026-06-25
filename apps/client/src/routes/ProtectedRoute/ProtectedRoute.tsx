'use client';

import type { ReactNode } from 'react';

import { ProtectedRoute as SharedProtectedRoute } from '@e-pharmacy/auth/guards';
import { useAuth } from '@e-pharmacy/auth/core';
import { Button, LoadingSpinner } from '@e-pharmacy/ui/common';
import { ROUTES } from '@/lib/routes';

//===================================================================

type ClientProtectedRouteProps = {
  children: ReactNode;
};

//===================================================================

function AuthUnavailableFallback() {
  const { retryAuthBootstrap, isRefreshingUser } = useAuth();

  return (
    <div role="alert" style={{ padding: '48px 16px', textAlign: 'center' }}>
      <p style={{ marginBottom: 16 }}>
        We could not verify your session right now. Please try again before
        opening this private page.
      </p>

      <Button
        type="button"
        size="sm"
        disabled={isRefreshingUser}
        onClick={() => void retryAuthBootstrap()}
      >
        {isRefreshingUser ? 'Checking session...' : 'Try again'}
      </Button>
    </div>
  );
}

//===================================================================

function ClientProtectedRoute({ children }: ClientProtectedRouteProps) {
  return (
    <SharedProtectedRoute
      loginPath={ROUTES.LOGIN}
      loadingFallback={<LoadingSpinner label="Checking your session..." />}
      redirectingFallback={<LoadingSpinner label="Redirecting to login..." />}
      authUnavailableFallback={<AuthUnavailableFallback />}
    >
      {children}
    </SharedProtectedRoute>
  );
}

export default ClientProtectedRoute;
