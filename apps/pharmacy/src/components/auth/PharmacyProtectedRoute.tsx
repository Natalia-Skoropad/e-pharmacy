'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

import { useAuth } from '@e-pharmacy/auth/react';
import { ErrorPage, PageLoader } from '@e-pharmacy/ui/status-pages';

import { PHARMACY_ROUTES } from '@/lib/routes';

import {
  getSharedLoginUrl,
  getSharedLoginUrlForCurrentPharmacyPage,
} from '@/lib/auth/shared-auth';

//===================================================================

const CLIENT_APP_FALLBACK_PATH = '/';
const ADMIN_APP_FALLBACK_PATH = '/admin/dashboard';

//===================================================================

type PharmacyProtectedRouteProps = Readonly<{
  children: ReactNode;
}>;

//===================================================================

function getForbiddenRedirectPath(role?: string) {
  if (role === 'admin') return ADMIN_APP_FALLBACK_PATH;
  return CLIENT_APP_FALLBACK_PATH;
}

//===================================================================

export function PharmacyProtectedRoute({
  children,
}: PharmacyProtectedRouteProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();

  const {
    isAuthenticated,
    isBootstrapping,
    isUnavailable,
    user,
    logout,
    retryAuthBootstrap,
  } = useAuth();
  const isPharmacy = user?.role === 'pharmacy';
  const isBlocked = user?.status === 'blocked';

  useEffect(() => {
    if (isBootstrapping || isUnavailable) return;

    if (!isAuthenticated) {
      const hash = typeof window === 'undefined' ? '' : window.location.hash;
      const currentPath = `${pathname}${queryString ? `?${queryString}` : ''}${hash}`;
      window.location.assign(
        getSharedLoginUrlForCurrentPharmacyPage(currentPath)
      );
      return;
    }

    if (!isPharmacy) {
      router.replace(getForbiddenRedirectPath(user?.role));
      return;
    }

    if (isBlocked) {
      void logout().finally(() => {
        window.location.assign(getSharedLoginUrl(PHARMACY_ROUTES.DASHBOARD));
      });
    }
  }, [
    isAuthenticated,
    isBlocked,
    isBootstrapping,
    isPharmacy,
    isUnavailable,
    logout,
    pathname,
    queryString,
    router,
    user?.role,
  ]);

  if (isBootstrapping) {
    return <PageLoader label="Checking pharmacy access..." />;
  }

  if (isUnavailable) {
    return (
      <ErrorPage
        title="We could not verify pharmacy access"
        description="The authentication service is temporarily unavailable. Retry the session check before opening the cabinet."
        homeHref={getSharedLoginUrl()}
        homeLabel="Open login"
        retryLabel="Retry session check"
        onRetry={() => void retryAuthBootstrap()}
      />
    );
  }

  if (!isAuthenticated || !isPharmacy || isBlocked) {
    return <PageLoader label="Redirecting..." />;
  }

  return children;
}
