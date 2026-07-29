'use client';

import type { ReactNode } from 'react';

import { GuestOnlyRoute as SharedGuestOnlyRoute } from '@e-pharmacy/auth/next';
import { useAuth } from '@e-pharmacy/auth/react';
import { LoadingSpinner } from '@e-pharmacy/ui/primitives';

import {
  resolveAuthenticatedRouteForClientApp,
  resolveTrustedClientAuthExternalRedirect,
} from '@/lib/auth';

import { getPharmacyAppConfiguration } from '@/lib/auth/pharmacy-app-config';

import { PharmacyAppConfigurationState } from '../PharmacyAppConfigurationState';

//===================================================================

type ClientGuestOnlyRouteProps = {
  children: ReactNode;
};

//===================================================================

function ClientGuestOnlyRoute({ children }: ClientGuestOnlyRouteProps) {
  const { status, user } = useAuth();
  const pharmacyConfiguration =
    status === 'authenticated' &&
    user?.role === 'pharmacy' &&
    user.status === 'active'
      ? getPharmacyAppConfiguration()
      : null;

  if (pharmacyConfiguration && !pharmacyConfiguration.ok) {
    return (
      <PharmacyAppConfigurationState message={pharmacyConfiguration.message} />
    );
  }

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
