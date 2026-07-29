'use client';

import type { ReactNode } from 'react';

import { RoleProtectedRoute } from '@e-pharmacy/auth/next';
import { useAuth } from '@e-pharmacy/auth/react';
import { LoadingSpinner } from '@e-pharmacy/ui/primitives';
import { ErrorPage } from '@e-pharmacy/ui/status-pages';

import { ROUTES } from '@/lib/routes';
import { canAccessClientPrivateRoutes } from '@/lib/auth/client-route-access';
import { getPharmacyAppConfiguration } from '@/lib/auth/pharmacy-app-config';

import {
  resolveLoginDestination,
  resolveTrustedClientAuthExternalRedirect,
} from '@/lib/auth';

import { PharmacyAppConfigurationState } from '../PharmacyAppConfigurationState';

//===================================================================

type ClientProtectedRouteProps = {
  children: ReactNode;
};

//===================================================================

function AuthUnavailableState() {
  const { retryAuthBootstrap } = useAuth();

  return (
    <ErrorPage
      title="We could not verify your session"
      description="The authentication service is temporarily unavailable. Try again before continuing."
      homeHref={ROUTES.HOME}
      retryLabel="Retry session check"
      onRetry={() => void retryAuthBootstrap()}
    />
  );
}

//===================================================================

function ClientProtectedRoute({ children }: ClientProtectedRouteProps) {
  const { user } = useAuth();
  const pharmacyConfiguration =
    user?.role === 'pharmacy' && user.status === 'active'
      ? getPharmacyAppConfiguration()
      : null;

  if (pharmacyConfiguration && !pharmacyConfiguration.ok) {
    return (
      <PharmacyAppConfigurationState
        message={pharmacyConfiguration.message}
      />
    );
  }

  const forbiddenPath = user
    ? resolveLoginDestination({ user, requestedRedirect: null })
    : ROUTES.HOME;

  return (
    <RoleProtectedRoute
      allowedRoles={['client']}
      authorizeUser={canAccessClientPrivateRoutes}
      loginPath={ROUTES.LOGIN}
      forbiddenPath={forbiddenPath}
      resolveExternalRedirect={resolveTrustedClientAuthExternalRedirect}
      loadingFallback={<LoadingSpinner label="Checking your session..." />}
      authUnavailableFallback={<AuthUnavailableState />}
      redirectingFallback={<LoadingSpinner label="Redirecting to login..." />}
      forbiddenFallback={
        <LoadingSpinner label="Opening the right cabinet..." />
      }
    >
      {children}
    </RoleProtectedRoute>
  );
}

export default ClientProtectedRoute;
