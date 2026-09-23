'use client';

import type { ReactNode } from 'react';

import { RoleProtectedRoute } from '@e-pharmacy/auth/next';
import { useAuth } from '@e-pharmacy/auth/react';
import { ErrorPage, PageLoader } from '@e-pharmacy/ui/status-pages';

import { ADMIN_ROUTES } from '@/lib/routes';
import { canAccessAdminPrivateRoutes } from '@/lib/auth/admin-route-access';

import {
  getClientAppDestination,
  getPharmacyAppDestination,
  resolveTrustedAdminExternalRedirect,
  type ExternalAppDestinationResult,
} from '@/lib/auth/app-destinations';

import { STATUS_PAGE_IMAGE } from '@/lib/status-pages/status-page-image';

//===================================================================

type AdminProtectedRouteProps = Readonly<{
  children: ReactNode;
}>;

//===================================================================

function AuthUnavailableState() {
  const { retryAuthBootstrap } = useAuth();

  return (
    <ErrorPage
      title="We could not verify admin access"
      description="The authentication service is temporarily unavailable. Retry the session check before opening the admin cabinet."
      eyebrow="Access check"
      homeHref={ADMIN_ROUTES.LOGIN}
      homeLabel="Open login"
      retryLabel="Retry session check"
      variant="brand"
      landmark="main"
      image={STATUS_PAGE_IMAGE}
      onRetry={() => void retryAuthBootstrap()}
    />
  );
}

//===================================================================

function ConfigurationErrorState({
  result,
}: Readonly<{
  result: Extract<ExternalAppDestinationResult, { ok: false }>;
}>) {
  return (
    <ErrorPage
      title="We could not open the correct application"
      description={result.message}
      eyebrow="Application configuration"
      homeHref={ADMIN_ROUTES.LOGIN}
      homeLabel="Open login"
      retryLabel="Reload configuration"
      variant="brand"
      landmark="main"
      image={STATUS_PAGE_IMAGE}
      onRetry={() => window.location.reload()}
    />
  );
}

//===================================================================

export function AdminProtectedRoute({ children }: AdminProtectedRouteProps) {
  const { user } = useAuth();

  const clientDestination =
    user?.role === 'client' && user.status === 'active'
      ? getClientAppDestination()
      : null;

  if (clientDestination && !clientDestination.ok) {
    return <ConfigurationErrorState result={clientDestination} />;
  }

  const pharmacyDestination =
    user?.role === 'pharmacy' && user.status === 'active'
      ? getPharmacyAppDestination()
      : null;

  if (pharmacyDestination && !pharmacyDestination.ok) {
    return <ConfigurationErrorState result={pharmacyDestination} />;
  }

  const forbiddenPath = clientDestination?.ok
    ? clientDestination.config.destinationUrl
    : pharmacyDestination?.ok
      ? pharmacyDestination.config.destinationUrl
      : ADMIN_ROUTES.LOGIN;

  return (
    <RoleProtectedRoute
      allowedRoles={['admin']}
      authorizeUser={canAccessAdminPrivateRoutes}
      loginPath={ADMIN_ROUTES.LOGIN}
      forbiddenPath={forbiddenPath}
      resolveExternalRedirect={resolveTrustedAdminExternalRedirect}
      loadingFallback={<PageLoader label="Checking admin access..." />}
      authUnavailableFallback={<AuthUnavailableState />}
      redirectingFallback={<PageLoader label="Redirecting to login..." />}
      forbiddenFallback={
        <PageLoader label="Opening the right application..." />
      }
    >
      {children}
    </RoleProtectedRoute>
  );
}
